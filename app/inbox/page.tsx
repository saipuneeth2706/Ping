"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type EmailItem = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  isSent: boolean;
  bodyText?: string;
  bodyHtml?: string;
};

type EmailApiResponse = {
  messages: EmailItem[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
};

function mergeEmailsById(existing: EmailItem[], incoming: EmailItem[]) {
  const byId = new Map<string, EmailItem>();

  [...existing, ...incoming].forEach((email) => {
    byId.set(email.id, email);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const aTs = Date.parse(a.date);
    const bTs = Date.parse(b.date);
    const safeATs = Number.isNaN(aTs) ? 0 : aTs;
    const safeBTs = Number.isNaN(bTs) ? 0 : bTs;
    return safeBTs - safeATs;
  });
}

const GMAIL_ATTACHMENT_LIMIT_BYTES = 25 * 1024 * 1024;

type ComposeAttachmentPayload = {
  filename: string;
  mimeType: string;
  contentBase64: string;
  size: number;
};

// Extract sender name from email address
function extractSenderName(from: string): string {
  if (!from) return "Unknown";
  
  // Handle "Name <email@domain.com>" format
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  // Handle plain email format
  const emailMatch = from.match(/^([^@]+)@/);
  if (emailMatch) {
    return emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1);
  }
  
  return from;
}

// Extract domain from sender field
function extractSenderDomain(from: string): string {
  if (!from) return "unknown-domain";

  const normalizedFrom = from.trim().toLowerCase();

  // Extract email from "Name <email@domain.com>" format
  const angleEmailMatch = normalizedFrom.match(/<([^>]+)>/);
  const email = angleEmailMatch ? angleEmailMatch[1] : normalizedFrom;

  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1 || atIndex === email.length - 1) {
    return "unknown-domain";
  }

  return email.slice(atIndex + 1);
}

// Extract full sender email from sender field
function extractSenderEmail(from: string): string {
  if (!from) return "unknown@example.com";

  const normalizedFrom = from.trim().toLowerCase();

  // Extract email from "Name <email@domain.com>" format
  const angleEmailMatch = normalizedFrom.match(/<([^>]+)>/);
  if (angleEmailMatch) {
    return angleEmailMatch[1];
  }

  // If it's already an email, return it
  if (normalizedFrom.includes("@")) {
    return normalizedFrom;
  }

  return "unknown@example.com";
}

function extractFirstRecipientEmail(value: string): string {
  if (!value) return "";
  const firstAddress = value.split(",")[0]?.trim() ?? "";
  if (!firstAddress) return "";
  return extractSenderEmail(firstAddress);
}

function formatConversationName(counterpart: string): string {
  if (!counterpart) return "Unknown";
  const localPart = counterpart.split("@")[0] ?? counterpart;
  if (!localPart) return "Unknown";
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDateTimestamp(dateString: string) {
  const ts = Date.parse(dateString);
  return Number.isNaN(ts) ? 0 : ts;
}

function buildEmailSrcDoc(html: string) {
  const trimmed = html.trim();
  const withAnchorTarget = trimmed.replace(
    /<a(?![^>]*\btarget\s*=)([^>]*)>/gi,
    '<a target="_blank" rel="noopener noreferrer"$1>',
  );
  const withSafeRel = withAnchorTarget.replace(
    /<a([^>]*\btarget\s*=\s*["']?_blank["']?[^>]*)>/gi,
    (match, attrs) => {
      if (/\brel\s*=/.test(attrs)) return match;
      return `<a${attrs} rel="noopener noreferrer">`;
    },
  );
  const hasHtmlTag = /<html[\s>]/i.test(withSafeRel);

  if (hasHtmlTag) {
    if (/<head[\s>]/i.test(withSafeRel)) {
      return withSafeRel.replace(/<head(.*?)>/i, '<head$1><base target="_blank">');
    }

    return withSafeRel.replace(/<html(.*?)>/i, '<html$1><head><base target="_blank"></head>');
  }

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      :root { color-scheme: light; }
      html, body { margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; line-height: 1.45; color: #111827; }
    </style>
  </head>
  <body>${withSafeRel}</body>
</html>`;
}

function estimateBase64Size(sizeBytes: number) {
  return Math.ceil(sizeBytes / 3) * 4;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function buildSummaryInput(email: EmailItem) {
  const bodySource = (email.bodyText || email.snippet || "").trim();
  return {
    subject: (email.subject || "(No Subject)").trim(),
    snippet: (email.snippet || "").trim(),
    bodyText: bodySource.slice(0, 8000),
  };
}

export default function InboxPage() {
  const { status } = useSession();
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreEmails, setLoadingMoreEmails] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [summaryByEmailId, setSummaryByEmailId] = useState<Record<string, string>>({});
  const [summaryErrorByEmailId, setSummaryErrorByEmailId] = useState<Record<string, string>>({});
  const [summarizingByEmailId, setSummarizingByEmailId] = useState<Record<string, boolean>>({});

  const buildEmailsUrl = (pageToken?: string, query?: string) => {
    const params = new URLSearchParams();
    params.set("maxResults", "150");

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    if (query?.trim()) {
      params.set("q", query.trim());
    }

    return `/api/emails?${params.toString()}`;
  };

  useEffect(() => {
    if (!composeOpen) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [composeOpen]);

  useEffect(() => {
    async function loadEmails() {
      setLoading(true);
      setError(null);

      const response = await fetch(buildEmailsUrl(), { cache: "no-store" });

      if (response.status === 401) {
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not load emails");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as EmailApiResponse;
      setEmails(data.messages ?? []);
      setNextPageToken(data.nextPageToken ?? null);
      setLoading(false);
    }

    if (status !== "loading") {
      void loadEmails();
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchInput.trim().toLowerCase());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleFetchMoreEmails = async () => {
    if (loadingMoreEmails || !nextPageToken) return;

    setLoadingMoreEmails(true);

    try {
      const response = await fetch(
        buildEmailsUrl(nextPageToken),
        { cache: "no-store" },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not load more emails");
        setLoadingMoreEmails(false);
        return;
      }

      const data = (await response.json()) as EmailApiResponse;

      setEmails((prev) => mergeEmailsById(prev, data.messages ?? []));
      setNextPageToken(data.nextPageToken ?? null);
      setError(null);
      setLoadingMoreEmails(false);
    } catch {
      setError("Could not load more emails");
      setLoadingMoreEmails(false);
    }
  };

  const senderGroups = useMemo(() => {
    const groups = new Map<string, EmailItem[]>();

    emails.forEach((email) => {
      const counterpartHeader = email.isSent ? email.to : email.from;
      const counterpartEmail = extractFirstRecipientEmail(counterpartHeader);
      const conversationKey = counterpartEmail || "unknown@example.com";
      const existing = groups.get(conversationKey) ?? [];
      existing.push(email);
      groups.set(conversationKey, existing);
    });

    return Array.from(groups.entries())
      .map(([counterpartEmail, senderEmails]) => {
        const latestEmail = senderEmails.reduce((latest, current) => {
          return getDateTimestamp(current.date) > getDateTimestamp(latest.date) ? current : latest;
        }, senderEmails[0]);

        const nameSource = latestEmail?.isSent ? latestEmail?.to : latestEmail?.from;
        const extractedName = extractSenderName(nameSource || "").trim();
        const displayName =
          !extractedName || extractedName.includes("@")
            ? formatConversationName(counterpartEmail)
            : extractedName;

        return {
          sender: counterpartEmail,
          senderName: displayName,
          senderEmail: counterpartEmail,
          emails: senderEmails,
          latestDate: latestEmail?.date ?? "",
          latestSubject: latestEmail?.subject || "No subject",
        };
      })
      .sort((a, b) => getDateTimestamp(b.latestDate) - getDateTimestamp(a.latestDate));
  }, [emails]);

  const filteredSenderGroups = useMemo(() => {
    if (!debouncedSearchQuery) return senderGroups;

    return senderGroups.filter((group) =>
      group.senderName.toLowerCase().includes(debouncedSearchQuery),
    );
  }, [debouncedSearchQuery, senderGroups]);

  const activeSender = useMemo(() => {
    if (selectedSender && filteredSenderGroups.some((group) => group.sender === selectedSender)) {
      return selectedSender;
    }
    return filteredSenderGroups[0]?.sender ?? "";
  }, [selectedSender, filteredSenderGroups]);

  const selectedSenderMessages = useMemo(() => {
    if (!activeSender) return [];
    const group = filteredSenderGroups.find((item) => item.sender === activeSender);
    return [...(group?.emails ?? [])].sort((a, b) => getDateTimestamp(a.date) - getDateTimestamp(b.date));
  }, [activeSender, filteredSenderGroups]);

  const visibleSelectedEmail = useMemo(() => {
    if (!selectedEmail) return null;
    return selectedSenderMessages.some((email) => email.id === selectedEmail.id) ? selectedEmail : null;
  }, [selectedEmail, selectedSenderMessages]);

  const selectedSenderName = useMemo(() => {
    const group = filteredSenderGroups.find((item) => item.sender === activeSender);
    return group?.senderName || "";
  }, [activeSender, filteredSenderGroups]);

  const attachmentEncodedSizeTotal = useMemo(() => {
    return composeAttachments.reduce((total, file) => total + estimateBase64Size(file.size), 0);
  }, [composeAttachments]);

  const attachmentLimitLabel = `${formatBytes(attachmentEncodedSizeTotal)} / ${formatBytes(
    GMAIL_ATTACHMENT_LIMIT_BYTES,
  )}`;

  const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = Array.from(event.target.files ?? []);
    if (chosenFiles.length === 0) return;

    const merged = [...composeAttachments, ...chosenFiles];
    const mergedEncodedSize = merged.reduce((total, file) => total + estimateBase64Size(file.size), 0);

    if (mergedEncodedSize > GMAIL_ATTACHMENT_LIMIT_BYTES) {
      setComposeError("Attachments exceed Gmail 25MB limit. Please remove some files.");
      event.target.value = "";
      return;
    }

    setComposeError(null);
    setComposeAttachments(merged);
    event.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleComposeSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!composeTo.trim()) {
      setComposeError("To email id is required.");
      return;
    }

    if (attachmentEncodedSizeTotal > GMAIL_ATTACHMENT_LIMIT_BYTES) {
      setComposeError("Attachments exceed Gmail 25MB limit. Please remove some files.");
      return;
    }

    setComposeSending(true);
    setComposeError(null);
    setComposeSuccess(null);

    try {
      const attachmentsPayload: ComposeAttachmentPayload[] = await Promise.all(
        composeAttachments.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return {
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            contentBase64: arrayBufferToBase64(buffer),
            size: file.size,
          };
        }),
      );

      const response = await fetch("/api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc,
          bcc: composeBcc,
          subject: composeSubject,
          body: composeBody,
          attachments: attachmentsPayload,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let nextError = "Failed to send email.";

        try {
          const data = JSON.parse(errorText) as {
            error?: string;
            action?: string;
            details?: string;
          };

          nextError = data.error ?? nextError;

          if (data.action === "reauth") {
            nextError = `${nextError} Please sign out and sign in again.`;
          }
        } catch {
          if (errorText.trim()) {
            nextError = errorText;
          }
        }

        setComposeError(nextError);
        setComposeSending(false);
        return;
      }

      setComposeSuccess("Email sent.");
      setComposeTo("");
      setComposeCc("");
      setComposeBcc("");
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachments([]);
      setComposeOpen(false);
      setComposeSending(false);
    } catch {
      setComposeError("Failed to send email.");
      setComposeSending(false);
    }
  };

  const handleReplyFromEmail = (email: EmailItem) => {
    const replyTo = email.isSent
      ? extractFirstRecipientEmail(email.to)
      : extractSenderEmail(email.from);
    const currentSubject = (email.subject || "(No Subject)").trim();
    const replySubject = /^re:/i.test(currentSubject) ? currentSubject : `Re: ${currentSubject}`;
    const sentAt = email.date
      ? new Date(email.date).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown time";
    const originalContent = (email.bodyText || email.snippet || "").trim();
    const quotedOriginal = originalContent
      ? originalContent
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n")
      : ">";

    setComposeTo(replyTo);
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject(replySubject);
    setComposeBody(`\n\nOn ${sentAt}, ${replyTo} wrote:\n${quotedOriginal}`);
    setComposeAttachments([]);
    setComposeError(null);
    setComposeSuccess(null);
    setSelectedEmail(null);
    setComposeOpen(true);
  };

  const handleSummarizeEmail = async (email: EmailItem) => {
    setSummaryErrorByEmailId((prev) => ({ ...prev, [email.id]: "" }));
    setSummarizingByEmailId((prev) => ({ ...prev, [email.id]: true }));

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSummaryInput(email)),
      });

      const data = (await response.json()) as { summary?: string; error?: string };

      if (!response.ok) {
        setSummaryErrorByEmailId((prev) => ({
          ...prev,
          [email.id]: data.error ?? "Failed to generate summary.",
        }));
        setSummarizingByEmailId((prev) => ({ ...prev, [email.id]: false }));
        return;
      }

      setSummaryByEmailId((prev) => ({
        ...prev,
        [email.id]: (data.summary ?? "No summary available.").trim(),
      }));
      setSummarizingByEmailId((prev) => ({ ...prev, [email.id]: false }));
    } catch {
      setSummaryErrorByEmailId((prev) => ({
        ...prev,
        [email.id]: "Failed to generate summary.",
      }));
      setSummarizingByEmailId((prev) => ({ ...prev, [email.id]: false }));
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#0D1117] text-[#111827] dark:text-[#F9FAFB] overflow-hidden">
      {/* MAIN CONTENT */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm opacity-70">Loading emails...</p>
        </div>
      )}

      {!loading && status === "unauthenticated" && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="p-5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
            Please sign in with Google to fetch your Gmail messages.
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="p-5 rounded-xl border border-red-300 bg-red-50 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      )}

      {!loading && !error && emails.length === 0 && status === "authenticated" && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-[#30363D]">
            No emails yet. Connect your Gmail and messages will appear here.
          </div>
        </div>
      )}

      {!loading && !error && emails.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANE: SENDERS LIST (3fr) */}
          <aside className="w-[30%] border-r border-[#E5E7EB] dark:border-[#30363D] flex flex-col bg-white dark:bg-[#161B22] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#30363D] flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold">Chats</h2>
                  <p className="text-xs opacity-60 mt-0.5">
                    {filteredSenderGroups.length} of {senderGroups.length} conversations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleFetchMoreEmails();
                    }}
                    disabled={loadingMoreEmails || !nextPageToken}
                    className="inline-flex items-center rounded-md border border-[#D1D5DB] dark:border-[#374151] px-2.5 py-1 text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#0D1117] disabled:opacity-60"
                  >
                    {loadingMoreEmails ? "Loading..." : nextPageToken ? "Fetch 500" : "No more"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeError(null);
                      setComposeSuccess(null);
                      setComposeOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500 bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    <span className="text-sm leading-none">+</span>
                    Compose
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setSelectedSender("");
                    setSelectedEmail(null);
                  }}
                  placeholder="Search contacts by name"
                  className="flex-1 rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0D1117] px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedSearchQuery("");
                    setSelectedSender("");
                    setSelectedEmail(null);
                  }}
                  disabled={!searchInput}
                  className="inline-flex items-center rounded-md border border-[#D1D5DB] dark:border-[#374151] px-2.5 py-1.5 text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#0D1117] disabled:opacity-60"
                >
                  Clear
                </button>
              </div>

              <p className="mt-1 text-[11px] opacity-60">Auto-search runs after you pause typing.</p>

              {composeSuccess && <p className="text-[11px] text-emerald-600 mt-1">{composeSuccess}</p>}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {filteredSenderGroups.map((group) => {
                const isActive = group.sender === activeSender;
                const senderInitial = group.senderName.charAt(0).toUpperCase();

                return (
                  <motion.button
                    key={group.sender}
                    onClick={() => setSelectedSender(group.sender)}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left px-3 py-3 border-b border-[#E5E7EB] dark:border-[#30363D] transition-colors min-h-[64px] flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? "bg-[#F0F2F5] dark:bg-[#262C36]"
                        : "hover:bg-[#F5F5F5] dark:hover:bg-[#1C2128]"
                    }`}
                  >
                    {/* SENDER AVATAR */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-semibold text-base flex-shrink-0">
                      {senderInitial}
                    </div>

                    {/* SENDER INFO */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{group.senderName}</p>
                      <p className="text-xs opacity-60 truncate mt-0.5">
                        {group.latestSubject}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                              {group.emails.length}
                            </span>
                          </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {new Date(group.latestDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {filteredSenderGroups.length === 0 && (
                <div className="px-4 py-8 text-center text-sm opacity-70">
                  {debouncedSearchQuery
                    ? `No contacts found for "${searchInput.trim()}".`
                    : "Start typing a contact name to filter conversations."}
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT PANE: MESSAGES VIEW (7fr) */}
          <section className="relative flex-1 flex flex-col bg-white dark:bg-[#0D1117] overflow-hidden">
            {activeSender ? (
              <>
                {/* HEADER */}
                <div className="px-6 py-3 border-b border-[#E5E7EB] dark:border-[#30363D] flex-shrink-0 bg-white dark:bg-[#161B22]">
                  <div>
                    <h2 className="text-base font-bold">{selectedSenderName}</h2>
                    <p className="text-xs opacity-60 mt-0.5">
                      {selectedSenderMessages.length} message{selectedSenderMessages.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* MESSAGES LIST */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2">
                  {selectedSenderMessages.map((email, index) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex flex-col ${email.isSent ? "items-end" : "items-start"}`}
                    >
                      <div className={`flex items-start gap-2 ${email.isSent ? "flex-row-reverse" : ""}`}>
                        <motion.button
                          type="button"
                          onClick={() => void handleSummarizeEmail(email)}
                          disabled={!!summarizingByEmailId[email.id]}
                          className="inline-flex h-8 cursor-pointer items-center rounded-md border border-[#D1D5DB] bg-white px-2.5 text-[11px] font-semibold text-[#111827] shadow-sm hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#374151] dark:bg-[#161B22] dark:text-[#F9FAFB] dark:hover:bg-[#0D1117]"
                        >
                          {summarizingByEmailId[email.id] ? "AI..." : "AI"}
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => setSelectedEmail(email)}
                          animate={{ scale: summaryByEmailId[email.id] ? 1.01 : 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`max-w-[82%] rounded-2xl px-4 py-3 text-left transition-colors cursor-pointer border ${
                            email.isSent
                              ? summaryByEmailId[email.id]
                                ? "bg-emerald-400 border-emerald-300 text-white hover:bg-emerald-500"
                                : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"
                              : summaryByEmailId[email.id]
                                ? "bg-sky-50 border-sky-200 text-[#0B3A59] dark:bg-sky-950/35 dark:border-sky-900/60 dark:text-sky-100 hover:bg-sky-100 dark:hover:bg-sky-950/55"
                                : "bg-[#F0F2F5] border-[#E5E7EB] text-[#111827] dark:bg-[#262C36] dark:border-[#30363D] dark:text-white hover:bg-[#E5E9F0] dark:hover:bg-[#2D3748]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-medium text-sm truncate ${email.isSent ? "text-white" : ""}`}>
                              {email.subject || "(No Subject)"}
                            </p>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                                email.isSent
                                  ? "bg-white/20 text-white"
                                  : summaryByEmailId[email.id]
                                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              }`}
                            >
                              {summaryByEmailId[email.id]
                                ? "AI Summary"
                                : email.isSent
                                  ? "Sent"
                                  : "Received"}
                            </span>
                          </div>
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.p
                                key={`${email.id}-${summaryByEmailId[email.id] ? "ai" : summaryErrorByEmailId[email.id] ? "error" : "normal"}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className={`text-xs mt-1.5 line-clamp-2 ${
                                  email.isSent
                                    ? "text-white/95"
                                    : summaryByEmailId[email.id]
                                      ? "text-sky-800 dark:text-sky-100"
                                      : "opacity-75"
                                }`}
                              >
                                {summaryErrorByEmailId[email.id]
                                  ? summaryErrorByEmailId[email.id]
                                  : summaryByEmailId[email.id] || email.snippet || "No preview available."}
                              </motion.p>
                            </AnimatePresence>
                          <p className={`text-[11px] mt-2 ${email.isSent ? "text-white/80" : "opacity-55"}`}>
                            {email.date
                              ? new Date(email.date).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}

                  {selectedSenderMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm opacity-60">No messages from this sender.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm opacity-60">
                  {debouncedSearchQuery
                    ? "No matching conversation. Try a different contact name."
                    : "Select a conversation to view messages"}
                </p>
              </div>
            )}

            <AnimatePresence>
              {visibleSelectedEmail && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Close email preview"
                    onClick={() => setSelectedEmail(null)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/25 z-20"
                  />

                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 280, damping: 30 }}
                    className="absolute right-0 top-0 h-full w-full md:w-[88%] bg-white dark:bg-[#161B22] border-l border-[#E5E7EB] dark:border-[#30363D] z-30 flex flex-col"
                  >
                    <div className="px-4 py-2.5 border-b border-[#E5E7EB] dark:border-[#30363D] flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate leading-5">
                          {visibleSelectedEmail.subject || "(No Subject)"}
                        </h3>
                        <p className="text-xs opacity-70 mt-0.5 break-all">
                          From: {extractSenderEmail(visibleSelectedEmail.from)}
                        </p>
                        <p className="text-xs opacity-70 mt-0.5 break-all">
                          To: {visibleSelectedEmail.to || "-"}
                        </p>
                        <p className="text-xs opacity-60 mt-0.5">
                          {visibleSelectedEmail.date
                            ? new Date(visibleSelectedEmail.date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReplyFromEmail(visibleSelectedEmail)}
                          className="px-2.5 py-1 rounded-md border border-emerald-500 bg-emerald-500 text-white text-xs hover:bg-emerald-600"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEmail(null)}
                          className="px-2.5 py-1 rounded-md border border-[#E5E7EB] dark:border-[#30363D] text-xs hover:bg-[#F4F6F8] dark:hover:bg-[#0D1117]"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                      {visibleSelectedEmail.bodyHtml ? (
                        <iframe
                          title="Email content"
                          sandbox="allow-popups allow-popups-to-escape-sandbox"
                          srcDoc={buildEmailSrcDoc(visibleSelectedEmail.bodyHtml)}
                          className="w-full h-full rounded-md border border-[#E5E7EB] dark:border-[#30363D] bg-white"
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[#111827] dark:text-[#F3F4F6] font-sans">
                          {visibleSelectedEmail.bodyText ||
                            visibleSelectedEmail.snippet ||
                            "No email body available."}
                        </pre>
                      )}
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </section>
        </div>
      )}

      <AnimatePresence>
        {composeOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (composeSending) return;
                setComposeOpen(false);
              }}
              className="fixed inset-0 z-40 bg-black/30"
              aria-label="Close compose popup"
            />

            <motion.section
              initial={{ opacity: 0, x: 36, y: 24 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 24, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 z-50 sm:w-[44rem] sm:max-w-[calc(100vw-1rem)] sm:h-[28rem] max-h-[82vh] rounded-xl border border-[#E5E7EB] dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleComposeSend} className="p-4 h-full flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#30363D] pb-3">
                  <h3 className="text-sm font-semibold tracking-tight">Compose email</h3>
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    disabled={composeSending}
                    className="px-2.5 py-1.5 text-xs rounded-md border border-[#E5E7EB] dark:border-[#30363D] hover:bg-[#F3F4F6] dark:hover:bg-[#0D1117]"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-1 space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs font-medium block space-y-1.5">
                      To
                      <input
                        required
                        type="text"
                        value={composeTo}
                        onChange={(event) => setComposeTo(event.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-xs font-medium space-y-1.5">
                        Cc
                        <input
                          type="text"
                          value={composeCc}
                          onChange={(event) => setComposeCc(event.target.value)}
                          placeholder="cc@example.com"
                          className="w-full rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0"
                        />
                      </label>

                      <label className="text-xs font-medium space-y-1.5">
                        Bcc
                        <input
                          type="text"
                          value={composeBcc}
                          onChange={(event) => setComposeBcc(event.target.value)}
                          placeholder="bcc@example.com"
                          className="w-full rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0"
                        />
                      </label>
                    </div>

                    <label className="text-xs font-medium block space-y-1.5">
                      Subject
                      <input
                        type="text"
                        value={composeSubject}
                        onChange={(event) => setComposeSubject(event.target.value)}
                        placeholder="Subject"
                        className="w-full rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0"
                      />
                    </label>
                  </div>

                  <label className="text-xs font-medium block space-y-1.5">
                    Mail
                    <textarea
                      value={composeBody}
                      onChange={(event) => setComposeBody(event.target.value)}
                      placeholder="Write your message..."
                      rows={8}
                        className="w-full min-h-[9.5rem] rounded-md border border-[#D1D5DB] dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-0"
                    />
                  </label>

                  <div className="space-y-2 pt-3 border-t border-[#E5E7EB] dark:border-[#30363D]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Attachments</label>
                      <span className="text-xs opacity-70">{attachmentLimitLabel}</span>
                    </div>

                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentSelection}
                      className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-[#E5E7EB] dark:file:bg-[#30363D] file:px-3 file:py-2 file:text-xs file:font-medium"
                    />

                    {composeAttachments.length > 0 && (
                      <div className="max-h-24 overflow-y-auto scrollbar-hide space-y-1.5 rounded-md border border-[#E5E7EB] dark:border-[#30363D] p-2">
                        {composeAttachments.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                            <p className="truncate">{file.name}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="opacity-70">{formatBytes(file.size)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(index)}
                                className="rounded px-2 py-0.5 border border-[#E5E7EB] dark:border-[#30363D] hover:bg-[#F3F4F6] dark:hover:bg-[#0D1117]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {composeError && (
                  <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    {composeError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB] dark:border-[#30363D]">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    disabled={composeSending}
                    className="rounded-md border border-[#D1D5DB] dark:border-[#374151] px-3 py-1.5 text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#0D1117] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={composeSending}
                    className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {composeSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
