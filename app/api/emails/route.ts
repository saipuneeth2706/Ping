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
  date: string;
  bodyText: string;
  bodyHtml: string;
};

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

function getMessageBody(payload: GmailMessageResponse["payload"]) {
  if (!payload) {
    return { bodyText: "", bodyHtml: "" };
  }

  const walk = (
    part: {
      mimeType?: string;
      body?: { data?: string };
      parts?: Array<{ mimeType?: string; body?: { data?: string }; parts?: Array<any> }>;
    },
  ): { text: string; html: string } => {
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get("pageToken") ?? "";
  const maxResults = Math.min(Number(searchParams.get("maxResults") ?? "25"), 100);

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
          date: "",
          bodyText: "",
          bodyHtml: "",
        };
      }

      const detail = (await messageResponse.json()) as GmailMessageResponse;
      const headers = detail.payload?.headers;
      const body = getMessageBody(detail.payload);

      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet ?? "",
        subject: getHeaderValue(headers, "Subject"),
        from: getHeaderValue(headers, "From"),
        date: getHeaderValue(headers, "Date"),
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
