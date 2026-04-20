import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment, inferImpactFromText, safeId } from "@/lib/api/scraperUtils";
import { addFinancialJuiceLiveItem } from "@/lib/news/liveFinancialJuiceStore";

export const dynamic = "force-dynamic";

type IngestItemInput = {
  sourcePostId?: string | number;
  headline?: string;
  text?: string;
  publishedAt?: string;
  url?: string;
  category?: string;
};

type IngestRequestBody = {
  item?: IngestItemInput;
  items?: IngestItemInput[];
};

const normalizeHeadline = (input: IngestItemInput) => {
  const headline = (input.headline ?? input.text ?? "").replace(/\s+/g, " ").trim();
  return headline;
};

const toIso = (value: string | undefined) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const toTimestampLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

export async function POST(request: NextRequest) {
  const expectedKey = process.env.FINANCIAL_JUICE_INGEST_KEY;
  if (!expectedKey) {
    return NextResponse.json({ error: "FINANCIAL_JUICE_INGEST_KEY is not configured." }, { status: 500 });
  }

  const incomingKey = request.headers.get("x-financial-juice-key")?.trim() ?? "";
  if (!incomingKey || incomingKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized ingest request." }, { status: 401 });
  }

  let body: IngestRequestBody;
  try {
    body = (await request.json()) as IngestRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const inputItems = body.items ?? (body.item ? [body.item] : []);

  if (inputItems.length === 0) {
    return NextResponse.json({ error: "No ingest items provided." }, { status: 400 });
  }

  let added = 0;
  let skipped = 0;

  inputItems.forEach((input, index) => {
    const headline = normalizeHeadline(input);
    if (!headline || headline.length < 8) {
      skipped += 1;
      return;
    }

    const publishedAt = toIso(input.publishedAt);
    const sourcePostId = String(input.sourcePostId ?? safeId(`${headline}-${publishedAt}`, index));
    const { sentiment, score } = analyzeSentiment(headline);

    const result = addFinancialJuiceLiveItem({
      id: `fj-telegram-${sourcePostId}`,
      sourcePostId,
      publishedAt,
      timestamp: toTimestampLabel(publishedAt),
      headline,
      impact: inferImpactFromText(headline),
      sentiment,
      sentimentScore: score,
      source: "Financial Juice Telegram",
      category: input.category?.trim() || "Live Wire",
      url: input.url,
      rawText: input.text,
      receivedAt: new Date().toISOString(),
    });

    if (result.added) {
      added += 1;
    } else {
      skipped += 1;
    }
  });

  return NextResponse.json(
    {
      ok: true,
      added,
      skipped,
      total: inputItems.length,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
