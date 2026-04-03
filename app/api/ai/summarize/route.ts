import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "../../../../lib/auth";

type SummarizeRequest = {
  subject?: string;
  snippet?: string;
  bodyText?: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function normalizeOneLineSummary(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^\"|\"$/g, "")
    .trim();
}

function buildPromptInput(payload: SummarizeRequest) {
  const subject = (payload.subject || "(No Subject)").trim();
  const snippet = (payload.snippet || "").trim();
  const bodyText = (payload.bodyText || "").trim().slice(0, 8000);

  return [
    `Subject: ${subject}`,
    `Snippet: ${snippet || "N/A"}`,
    `Body: ${bodyText || "N/A"}`,
  ].join("\n\n");
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as SummarizeRequest;
  const hasMeaningfulContent =
    !!payload?.subject?.trim() || !!payload?.snippet?.trim() || !!payload?.bodyText?.trim();

  if (!hasMeaningfulContent) {
    return NextResponse.json(
      { error: "Email content is required for summarization" },
      { status: 400 },
    );
  }

  const model = process.env.OPENROUTER_SUMMARY_MODEL || "openai/gpt-4o-mini";

  const providerResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.NEXTAUTH_URL ? { "HTTP-Referer": process.env.NEXTAUTH_URL } : {}),
      "X-Title": "Ping Mail Summarizer",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Summarize emails in exactly one concise sentence. No bullet points. No markdown. Keep it factual and action-oriented.",
        },
        {
          role: "user",
          content: buildPromptInput(payload),
        },
      ],
    }),
    cache: "no-store",
  });

  const responseText = await providerResponse.text();
  let parsed: OpenRouterResponse | null = null;

  try {
    parsed = JSON.parse(responseText) as OpenRouterResponse;
  } catch {
    parsed = null;
  }

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        error:
          parsed?.error?.message ||
          "OpenRouter request failed while generating summary",
      },
      { status: providerResponse.status || 502 },
    );
  }

  const rawSummary = parsed?.choices?.[0]?.message?.content || "";
  const summary = normalizeOneLineSummary(rawSummary);

  if (!summary) {
    return NextResponse.json(
      { error: "Model returned an empty summary" },
      { status: 502 },
    );
  }

  return NextResponse.json({ summary });
}