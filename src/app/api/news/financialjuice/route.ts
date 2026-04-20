import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { MARKET_KEYWORDS, normalizeMarket } from "@/lib/market";
import { analyzeSentiment, fetchWithTimeout, inferImpactFromText, normalizeText, safeId } from "@/lib/api/scraperUtils";
import { addFinancialJuiceLiveItem } from "@/lib/news/liveFinancialJuiceStore";

export const dynamic = "force-dynamic";

type MarketParam = "forex" | "crypto" | "commodities";

type FinancialJuiceApiItem = {
  id: string;
  sourcePostId: string;
  timestamp: string;
  publishedAt: string;
  headline: string;
  impact: "high" | "medium" | "low";
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  source: string;
  category: string;
  url: string;
};

const TELEGRAM_URL = process.env.FINANCIAL_JUICE_TELEGRAM_URL ?? "https://t.me/s/FinancialJuice";

const isMarketMatch = (headline: string, category: string, market: MarketParam) => {
  if (market === "forex") return true;
  const haystack = `${headline} ${category}`.toLowerCase();
  return MARKET_KEYWORDS[market].some((keyword) => haystack.includes(keyword));
};

const toTimestampLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

const parseTelegramFinancialJuice = async (): Promise<FinancialJuiceApiItem[]> => {
  const response = await fetchWithTimeout(TELEGRAM_URL, 12000);
  if (!response.ok) {
    throw new Error(`Telegram request failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rows: FinancialJuiceApiItem[] = [];

  $(".tgme_widget_message_wrap").each((index, element) => {
    const row = $(element);
    const postLink = normalizeText(row.find(".tgme_widget_message_date").attr("href"));
    const sourcePostId = postLink.split("/").pop() ?? "";
    const text = normalizeText(row.find(".tgme_widget_message_text").text());
    const timeNode = row.find("time").first();
    const publishedAtRaw = normalizeText(timeNode.attr("datetime"));
    const parsedDate = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

    if (!sourcePostId || !text) return;

    const { sentiment, score } = analyzeSentiment(text);

    rows.push({
      id: `fj-telegram-${safeId(sourcePostId, index)}`,
      sourcePostId,
      timestamp: toTimestampLabel(publishedAt),
      publishedAt,
      headline: text,
      impact: inferImpactFromText(text),
      sentiment,
      sentimentScore: score,
      source: "Financial Juice Telegram",
      category: "Live Wire",
      url: postLink,
    });
  });

  return rows.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
};

export async function GET(request: Request) {
  const market = normalizeMarket(new URL(request.url).searchParams.get("market"));

  try {
    const parsed = await parseTelegramFinancialJuice();
    const scoped = parsed.filter((item) => isMarketMatch(item.headline, item.category, market)).slice(0, 24);

    scoped.forEach((item) => {
      addFinancialJuiceLiveItem({
        ...item,
        rawText: item.headline,
        receivedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json(scoped, {
      headers: {
        "Cache-Control": "no-store",
        "x-financialjuice-source": "telegram",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown-financialjuice-error";
    console.error("FinancialJuice fetch warning:", message);

    return NextResponse.json([], {
      headers: {
        "Cache-Control": "no-store",
        "x-financialjuice-source": "telegram",
        "x-financialjuice-fallback-reason": "fetch-failed",
      },
    });
  }
}
