import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "../../../lib/auth";

type GmailListResponse = {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

type GmailMessageResponse = {
  id: string;
  threadId: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    mimeType?: string;
    headers?: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
      size?: number;
    };
    parts?: Array<{
      mimeType?: string;
      body?: {
        data?: string;
        size?: number;
      };
      parts?: Array<{
        mimeType?: string;
        body?: {
          data?: string;
          size?: number;
        };
      }>;
    }>;
  };
};

type ParsedMessage = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  isSent: boolean;
  bodyText: string;
  bodyHtml: string;
};

type MessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
};

type ComposeAttachment = {
  filename: string;
  mimeType: string;
  contentBase64: string;
  size: number;
};

type ComposeRequestBody = {
  to: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  attachments?: ComposeAttachment[];
};

type GmailApiErrorPayload = {
  error?: {
    message?: string;
    errors?: Array<{ reason?: string; message?: string }>;
    details?: Array<{ reason?: string; message?: string }>;
  };
};

const GMAIL_ATTACHMENT_LIMIT_BYTES = 25 * 1024 * 1024;

function getHeaderValue(
  headers: Array<{ name: string; value: string }> | undefined,
  headerName: string,
) {
  if (!headers) return "";
  const match = headers.find((header) => header.name.toLowerCase() === headerName.toLowerCase());
  return match?.value ?? "";
}

function decodeBase64Url(data: string | undefined) {
  if (!data) return "";
  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function extractPrimaryEmail(value: string) {
  if (!value) return "";
  const firstAddress = value.split(",")[0]?.trim() ?? "";
  const angleEmailMatch = firstAddress.match(/<([^>]+)>/);
  const email = angleEmailMatch ? angleEmailMatch[1] : firstAddress;
  return email.trim().toLowerCase();
}

function encodeBase64UrlFromUtf8(data: string) {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function normalizeAddressList(addresses: string | undefined) {
  if (!addresses) return "";
  return addresses
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function buildRawMimeMessage(payload: ComposeRequestBody) {
  const boundary = `ping-mixed-${Date.now().toString(36)}`;
  const to = normalizeAddressList(payload.to);
  const cc = normalizeAddressList(payload.cc);
  const bcc = normalizeAddressList(payload.bcc);
  const subject = payload.subject?.trim() || "";
  const body = payload.body || "";
  const attachments = payload.attachments ?? [];

  const lines: string[] = [
    "MIME-Version: 1.0",
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    ...(bcc ? [`Bcc: ${bcc}`] : []),
    `Subject: ${subject}`,
    `Content-Type: multipart/mixed; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
    "",
  ];

  for (const attachment of attachments) {
    lines.push(`--${boundary}`);
    lines.push(
      `Content-Type: ${attachment.mimeType || "application/octet-stream"}; name=\"${attachment.filename}\"`,
    );
    lines.push("Content-Transfer-Encoding: base64");
    lines.push(`Content-Disposition: attachment; filename=\"${attachment.filename}\"`);
    lines.push("");
    lines.push(attachment.contentBase64);
    lines.push("");
  }

  lines.push(`--${boundary}--`);

  return lines.join("\r\n");
}

function getMessageBody(payload: GmailMessageResponse["payload"]) {
  if (!payload) {
    return { bodyText: "", bodyHtml: "" };
  }

  const walk = (part: MessagePart): { text: string; html: string } => {
    let text = "";
    let html = "";

    if (part.mimeType === "text/plain") {
      text = decodeBase64Url(part.body?.data);
    }
    if (part.mimeType === "text/html") {
      html = decodeBase64Url(part.body?.data);
    }

    if (part.parts && part.parts.length > 0) {
      for (const child of part.parts) {
        const childBody = walk(child);
        if (!text && childBody.text) text = childBody.text;
        if (!html && childBody.html) html = childBody.html;
      }
    }

    return { text, html };
  };

  const body = walk(payload);

  if (!body.text && payload.body?.data) {
    body.text = decodeBase64Url(payload.body.data);
  }

  return {
    bodyText: body.text,
    bodyHtml: body.html,
  };
}

function parseGmailApiError(errorText: string) {
  try {
    const parsed = JSON.parse(errorText) as GmailApiErrorPayload;
    const message = parsed.error?.message ?? "";
    const reasons = [
      ...(parsed.error?.errors ?? []).map((item) => item.reason ?? ""),
      ...(parsed.error?.details ?? []).map((item) => item.reason ?? ""),
    ]
      .filter(Boolean)
      .join(" ");

    return { message, reasons };
  } catch {
    return { message: "", reasons: "" };
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;
  const sessionEmail = session?.user?.email?.toLowerCase() ?? "";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get("pageToken") ?? "";
  const maxResults = Math.min(Number(searchParams.get("maxResults") ?? "25"), 500);

  const gmailUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  gmailUrl.searchParams.set("maxResults", String(maxResults));
  gmailUrl.searchParams.set("q", searchParams.get("q") ?? "");
  if (pageToken) {
    gmailUrl.searchParams.set("pageToken", pageToken);
  }

  const listResponse = await fetch(gmailUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    return NextResponse.json(
      { error: "Failed to fetch Gmail message list", details: errorText },
      { status: listResponse.status },
    );
  }

  const listData = (await listResponse.json()) as GmailListResponse;

  const messages = listData.messages ?? [];

  const detailedMessages = await Promise.all(
    messages.map(async (message): Promise<ParsedMessage> => {
      const messageUrl = new URL(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
      );
      messageUrl.searchParams.set("format", "full");

      const messageResponse = await fetch(messageUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!messageResponse.ok) {
        return {
          id: message.id,
          threadId: message.threadId,
          snippet: "",
          subject: "",
          from: "",
          to: "",
          date: "",
          isSent: false,
          bodyText: "",
          bodyHtml: "",
        };
      }

      const detail = (await messageResponse.json()) as GmailMessageResponse;
      const headers = detail.payload?.headers;
      const body = getMessageBody(detail.payload);
      const from = getHeaderValue(headers, "From");
      const to = getHeaderValue(headers, "To");
      const fromEmail = extractPrimaryEmail(from);
      const isSent = (detail.labelIds ?? []).includes("SENT") || (!!sessionEmail && fromEmail === sessionEmail);

      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet ?? "",
        subject: getHeaderValue(headers, "Subject"),
        from,
        to,
        date: getHeaderValue(headers, "Date"),
        isSent,
        bodyText: body.bodyText,
        bodyHtml: body.bodyHtml,
      };
    }),
  );

  return NextResponse.json({
    messages: detailedMessages,
    nextPageToken: listData.nextPageToken ?? null,
    resultSizeEstimate: listData.resultSizeEstimate ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as ComposeRequestBody;

  if (!payload?.to?.trim()) {
    return NextResponse.json({ error: "To field is required" }, { status: 400 });
  }

  const attachments = payload.attachments ?? [];

  const encodedSizeTotal = attachments.reduce((total, attachment) => {
    if (!attachment.contentBase64) return total;
    return total + attachment.contentBase64.length;
  }, 0);

  if (encodedSizeTotal > GMAIL_ATTACHMENT_LIMIT_BYTES) {
    return NextResponse.json(
      { error: "Attachments exceed Gmail 25MB limit" },
      { status: 400 },
    );
  }

  const rawMessage = buildRawMimeMessage(payload);
  const encodedRaw = encodeBase64UrlFromUtf8(rawMessage);

  const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedRaw }),
    cache: "no-store",
  });

  if (!sendResponse.ok) {
    const errorText = await sendResponse.text();
    const parsedError = parseGmailApiError(errorText);
    const normalizedError = `${parsedError.message} ${parsedError.reasons}`.toLowerCase();

    if (
      sendResponse.status === 403 &&
      /(insufficient|scope|permission|forbidden|not\s+authorized)/.test(normalizedError)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing Gmail send permission. Sign out and sign in again, then allow send access.",
          action: "reauth",
          details: parsedError.message || errorText,
        },
        { status: 403 },
      );
    }

    if (sendResponse.status === 401) {
      return NextResponse.json(
        {
          error: "Google session expired. Sign out and sign in again.",
          action: "reauth",
          details: parsedError.message || errorText,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: parsedError.message || "Failed to send email",
        details: parsedError.message || errorText,
      },
      { status: sendResponse.status },
    );
  }

  const sent = (await sendResponse.json()) as { id?: string; threadId?: string };

  return NextResponse.json({ success: true, id: sent.id ?? "", threadId: sent.threadId ?? "" });
}
