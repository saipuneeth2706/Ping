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
  date: string;
  bodyText?: string;
  bodyHtml?: string;
};

type EmailApiResponse = {
  messages: EmailItem[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
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

export default function InboxPage() {
  const { status } = useSession();
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);

  useEffect(() => {
    async function loadEmails() {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/emails?maxResults=500", { cache: "no-store" });

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
      setLoading(false);
    }

    if (status !== "loading") {
      void loadEmails();
    }
  }, [status]);

  const senderGroups = useMemo(() => {
    const groups = new Map<string, EmailItem[]>();

    emails.forEach((email) => {
      // Group all senders from the same domain in one conversation bucket.
      const senderDomain = extractSenderDomain(email.from);
      const existing = groups.get(senderDomain) ?? [];
      existing.push(email);
      groups.set(senderDomain, existing);
    });

    const toTimestamp = (dateString: string) => {
      const ts = Date.parse(dateString);
      return Number.isNaN(ts) ? 0 : ts;
    };

    return Array.from(groups.entries())
      .map(([senderDomain, senderEmails]) => {
        const latestEmail = senderEmails.reduce((latest, current) => {
          return toTimestamp(current.date) > toTimestamp(latest.date) ? current : latest;
        }, senderEmails[0]);

        const extractedName = extractSenderName(latestEmail?.from || senderEmails[0]?.from || "").trim();
        const domainLabel = senderDomain
          .replace(/^www\./, "")
          .split(".")[0]
          .replace(/[-_]+/g, " ");
        const displayName =
          !extractedName || extractedName.includes("@")
            ? domainLabel.charAt(0).toUpperCase() + domainLabel.slice(1)
            : extractedName;

        return {
          sender: senderDomain,
          senderName: displayName,
          emails: senderEmails,
          latestDate: latestEmail?.date ?? "",
        };
      })
      .sort((a, b) => toTimestamp(b.latestDate) - toTimestamp(a.latestDate));
  }, [emails]);

  useEffect(() => {
    if (!selectedSender && senderGroups.length > 0) {
      setSelectedSender(senderGroups[0].sender);
    }
  }, [senderGroups]);

  const selectedSenderMessages = useMemo(() => {
    if (!selectedSender) return [];
    const group = senderGroups.find((item) => item.sender === selectedSender);
    return group?.emails ?? [];
  }, [selectedSender, senderGroups]);

  useEffect(() => {
    setSelectedEmail(null);
  }, [selectedSender]);

  const selectedSenderName = useMemo(() => {
    const group = senderGroups.find((item) => item.sender === selectedSender);
    return group?.senderName || "";
  }, [selectedSender, senderGroups]);

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
            No emails found for this query.
          </div>
        </div>
      )}

      {!loading && !error && emails.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANE: SENDERS LIST (3fr) */}
          <aside className="w-[30%] border-r border-[#E5E7EB] dark:border-[#30363D] flex flex-col bg-white dark:bg-[#161B22] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#30363D] flex-shrink-0">
              <h2 className="text-base font-bold">Chats</h2>
              <p className="text-xs opacity-60 mt-0.5">{senderGroups.length} conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {senderGroups.map((group) => {
                const isActive = group.sender === selectedSender;
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
                        {group.emails[0]?.subject || "No subject"}
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
            </div>
          </aside>

          {/* RIGHT PANE: MESSAGES VIEW (7fr) */}
          <section className="relative flex-1 flex flex-col bg-white dark:bg-[#0D1117] overflow-hidden">
            {selectedSender ? (
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
                      onClick={() => setSelectedEmail(email)}
                      className="rounded-lg px-4 py-3 bg-[#F0F2F5] dark:bg-[#262C36] hover:bg-[#E5E9F0] dark:hover:bg-[#2D3748] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-[#111827] dark:text-white truncate">
                              {email.subject || "(No Subject)"}
                            </p>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 whitespace-nowrap">
                              {extractSenderEmail(email.from)}
                            </span>
                          </div>
                          <p className="text-xs opacity-70 mt-1.5 line-clamp-2">
                            {email.snippet || "No preview available."}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs opacity-50 mt-2">
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
                <p className="text-sm opacity-60">Select a conversation to view messages</p>
              </div>
            )}

            <AnimatePresence>
              {selectedEmail && (
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
                          {selectedEmail.subject || "(No Subject)"}
                        </h3>
                        <p className="text-xs opacity-70 mt-0.5 break-all">
                          From: {extractSenderEmail(selectedEmail.from)}
                        </p>
                        <p className="text-xs opacity-60 mt-0.5">
                          {selectedEmail.date
                            ? new Date(selectedEmail.date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEmail(null)}
                        className="shrink-0 px-2.5 py-1 rounded-md border border-[#E5E7EB] dark:border-[#30363D] text-xs hover:bg-[#F4F6F8] dark:hover:bg-[#0D1117]"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                      {selectedEmail.bodyHtml ? (
                        <iframe
                          title="Email content"
                          sandbox="allow-popups allow-popups-to-escape-sandbox"
                          srcDoc={buildEmailSrcDoc(selectedEmail.bodyHtml)}
                          className="w-full h-full rounded-md border border-[#E5E7EB] dark:border-[#30363D] bg-white"
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[#111827] dark:text-[#F3F4F6] font-sans">
                          {selectedEmail.bodyText || selectedEmail.snippet || "No email body available."}
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
    </div>
  );
}
