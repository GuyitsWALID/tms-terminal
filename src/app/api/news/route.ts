import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { featuredNews } from "@/lib/terminalData";
import { MARKET_KEYWORDS, normalizeMarket } from "@/lib/market";
import type { MarketKey } from "@/types";
import {
  SCRAPER_TTL_MS,
  analyzeSentiment,
  fetchWithTimeout,
  inferImpactFromText,
  isCacheFresh,
  makeCacheRecord,
  normalizeText,
  safeId,
  type CacheRecord,
} from "@/lib/api/scraperUtils";
import { getFinancialJuiceSnapshot } from "@/lib/news/liveFinancialJuiceStore";

type NewsApiItem = {
  id: string;
  timestamp: string;
  headline: string;
  impact: "high" | "medium" | "low";
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  source: string;
  category: string;
  sourcePostId?: string;
  publishedAt?: string;
  url?: string;
};

const NEWS_CACHE = new Map<string, CacheRecord<NewsApiItem[]>>();

const getLiveFinancialJuiceItems = (): NewsApiItem[] => {
  return getFinancialJuiceSnapshot(80).map((item) => ({
    id: item.id,
    timestamp: item.timestamp,
    headline: item.headline,
    impact: item.impact,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    source: item.source,
    category: item.category,
    sourcePostId: item.sourcePostId,
    publishedAt: item.publishedAt,
    url: item.url,
  }));
};

const mergeWithLiveItems = (baseItems: NewsApiItem[]) => {
  const liveItems = getLiveFinancialJuiceItems();
  return dedupeNews([...liveItems, ...baseItems]).slice(0, 40);
};

const fallbackNewsItems = (market: MarketKey): NewsApiItem[] =>
  featuredNews
    .filter((item) => !item.market || item.market === market)
    .map((item) => ({
    id: item.id,
    timestamp: item.timestamp,
    headline: item.headline,
    impact: item.impact,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    source: item.source,
    category: item.category,
  }));

const parseForexFactoryNews = async (): Promise<NewsApiItem[]> => {
  const response = await fetchWithTimeout("https://www.forexfactory.com/news", 15000);
  if (!response.ok) throw new Error(`ForexFactory news request failed (${response.status})`);

  const html = await response.text();
  const $ = cheerio.load(html);
  const rows = $(".flexposts__story, .news__story, article, .story");
  const items: NewsApiItem[] = [];

  rows.each((index, element) => {
    const row = $(element);

    const headline =
      normalizeText(row.find(".flexposts__story-title, .news__story-title, h3, h2, a").first().text()) ||
      normalizeText(row.text());

    if (!headline || headline.length < 12) return;

    const timestamp =
      normalizeText(row.find("time, .flexposts__story-time, .news__story-time, .date, .time").first().text()) ||
      `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const category =
      normalizeText(row.find(".flexposts__story-topic, .topic, .category, .tag").first().text()) || "Macro";

    const { sentiment, score } = analyzeSentiment(headline);
    const impact = inferImpactFromText(`${headline} ${category}`);

    items.push({
      id: safeId(`${headline}-${timestamp}`, index),
      timestamp,
      headline,
      impact,
      sentiment,
      sentimentScore: score,
      source: "Forex Factory",
      category,
    });
  });

  return items;
};

const parseFinancialJuiceNews = async (): Promise<NewsApiItem[]> => {
  const response = await fetchWithTimeout("https://www.financialjuice.com/", 12000);
  if (!response.ok) throw new Error(`FinancialJuice request failed (${response.status})`);

  const html = await response.text();
  const $ = cheerio.load(html);
  const items: NewsApiItem[] = [];

  $(".news-item, .headline, .item, article").each((index, element) => {
    const row = $(element);
    const headline = normalizeText(row.find("a, h3, h2, span").first().text()) || normalizeText(row.text());
    if (!headline || headline.length < 12) return;

    const timestamp =
      normalizeText(row.find("time, .time, .date").first().text()) ||
      `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const category = normalizeText(row.find(".category, .tag").first().text()) || "General";
    const { sentiment, score } = analyzeSentiment(headline);
    const impact = inferImpactFromText(`${headline} ${category}`);

    items.push({
      id: safeId(`${headline}-${timestamp}`, index),
      timestamp,
      headline,
      impact,
      sentiment,
      sentimentScore: score,
      source: "Financial Juice",
      category,
    });
  });

  return items;
};

const dedupeNews = (items: NewsApiItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeText(item.headline).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const filterNewsByMarket = (items: NewsApiItem[], market: MarketKey) => {
  if (market === "forex") return { rows: items, usedGenericFallback: false };

  const keywords = MARKET_KEYWORDS[market];
  const scoped = items.filter((item) => {
    const haystack = `${item.headline} ${item.category}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  if (scoped.length > 0) {
    return { rows: scoped, usedGenericFallback: false };
  }

  return { rows: items, usedGenericFallback: true };
};

export async function GET(request: Request) {
  const market = normalizeMarket(new URL(request.url).searchParams.get("market"));
  const cacheKey = `news-feed-${market}`;

  const cached = NEWS_CACHE.get(cacheKey);
  if (cached && isCacheFresh(cached)) {
    const { rows: scopedItems, usedGenericFallback } = filterNewsByMarket(mergeWithLiveItems(cached.data), market);
    return NextResponse.json(scopedItems, {
      headers: {
        "Cache-Control": "no-store",
        "x-news-cache": "HIT",
        "x-news-source": `${cached.source},financialjuice-telegram-live`,
        "x-news-market": market,
        ...(usedGenericFallback ? { "x-news-fallback-reason": "market-generic-fallback" } : {}),
      },
    });
  }

  try {
    const [ffResult, fjResult] = await Promise.allSettled([
      parseForexFactoryNews(),
      parseFinancialJuiceNews(),
    ]);

    const ffItems = ffResult.status === "fulfilled" ? ffResult.value : [];
    const fjItems = fjResult.status === "fulfilled" ? fjResult.value : [];

    const mergedItems = mergeWithLiveItems([...ffItems, ...fjItems]);

    if (mergedItems.length > 0) {
      const sourceLabel = [
        ffItems.length > 0 ? "forexfactory" : null,
        fjItems.length > 0 ? "financialjuice" : null,
      ]
        .filter(Boolean)
        .join(",");

      const { rows: scopedItems, usedGenericFallback } = filterNewsByMarket(mergedItems, market);

      const record = makeCacheRecord(scopedItems, sourceLabel || "multi-source");
      NEWS_CACHE.set(cacheKey, record);

      return NextResponse.json(scopedItems, {
        headers: {
          "Cache-Control": "no-store",
          "x-news-cache": "MISS",
          "x-news-source": sourceLabel || "multi-source",
          "x-news-market": market,
          ...(usedGenericFallback ? { "x-news-fallback-reason": "market-generic-fallback" } : {}),
        },
      });
    }

    throw new Error("All news sources returned no rows");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown news error";
    console.error("News aggregation warning:", message);

    if (cached) {
      const { rows: scopedItems, usedGenericFallback } = filterNewsByMarket(mergeWithLiveItems(cached.data), market);
      return NextResponse.json(scopedItems, {
        headers: {
          "Cache-Control": "no-store",
          "x-news-cache": "STALE",
          "x-news-source": `${cached.source},financialjuice-telegram-live`,
          "x-news-fallback-reason": usedGenericFallback ? "market-generic-fallback" : "stale-cache",
          "x-news-market": market,
        },
      });
    }

    const fallback = mergeWithLiveItems(fallbackNewsItems(market));
    NEWS_CACHE.set(cacheKey, makeCacheRecord(fallback, "local-fallback"));
    const { rows: scopedItems, usedGenericFallback } = filterNewsByMarket(fallback, market);
    return NextResponse.json(scopedItems, {
      headers: {
        "Cache-Control": "no-store",
        "x-news-cache": "MISS",
        "x-news-source": "local-fallback,financialjuice-telegram-live",
        "x-news-fallback-reason": usedGenericFallback ? "market-generic-fallback" : "all-sources-failed",
        "x-news-market": market,
      },
    });
  } finally {
    for (const [key, value] of NEWS_CACHE.entries()) {
      if (Date.now() - value.createdAt > SCRAPER_TTL_MS * 6) NEWS_CACHE.delete(key);
    }
  }
}
