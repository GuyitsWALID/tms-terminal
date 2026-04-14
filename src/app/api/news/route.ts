import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { featuredNews } from "@/lib/terminalData";
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

type NewsApiItem = {
  id: string;
  timestamp: string;
  headline: string;
  impact: "high" | "medium" | "low";
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  source: string;
  category: string;
};

const NEWS_CACHE_KEY = "news-feed";
const NEWS_CACHE = new Map<string, CacheRecord<NewsApiItem[]>>();

const fallbackNewsItems = (): NewsApiItem[] =>
  featuredNews.map((item) => ({
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

const parseAlphaVantageNews = async (): Promise<NewsApiItem[]> => {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey || apiKey === "DEMO") return [];

  const response = await fetchWithTimeout(
    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=forex,financial_markets&sort=LATEST&limit=25&apikey=${apiKey}`,
    12000
  );

  if (!response.ok) return [];

  const payload = (await response.json()) as { feed?: Array<Record<string, unknown>> };
  const feed = Array.isArray(payload.feed) ? payload.feed : [];

  return feed
    .map((item, index) => {
      const headline = normalizeText(String(item.title ?? ""));
      if (!headline || headline.length < 12) return null;

      const category = normalizeText(String(item.category_within_source ?? "")) || "Macro";
      const source = normalizeText(String(item.source ?? "Alpha Vantage")) || "Alpha Vantage";
      const rawTime = normalizeText(String(item.time_published ?? ""));
      const timestamp = rawTime ? rawTime : `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      const { sentiment, score } = analyzeSentiment(headline);
      const impact = inferImpactFromText(`${headline} ${category}`);

      return {
        id: safeId(`${headline}-${timestamp}-${source}`, index),
        timestamp,
        headline,
        impact,
        sentiment,
        sentimentScore: score,
        source,
        category,
      } satisfies NewsApiItem;
    })
    .filter((item): item is NewsApiItem => Boolean(item));
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

export async function GET() {
  const cached = NEWS_CACHE.get(NEWS_CACHE_KEY);
  if (cached && isCacheFresh(cached)) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "no-store",
        "x-news-cache": "HIT",
        "x-news-source": cached.source,
      },
    });
  }

  try {
    const [ffResult, fjResult, alphaResult] = await Promise.allSettled([
      parseForexFactoryNews(),
      parseFinancialJuiceNews(),
      parseAlphaVantageNews(),
    ]);

    const ffItems = ffResult.status === "fulfilled" ? ffResult.value : [];
    const fjItems = fjResult.status === "fulfilled" ? fjResult.value : [];
    const alphaItems = alphaResult.status === "fulfilled" ? alphaResult.value : [];

    const mergedItems = dedupeNews([...ffItems, ...fjItems, ...alphaItems]).slice(0, 40);

    if (mergedItems.length > 0) {
      const sourceLabel = [
        ffItems.length > 0 ? "forexfactory" : null,
        fjItems.length > 0 ? "financialjuice" : null,
        alphaItems.length > 0 ? "alphavantage" : null,
      ]
        .filter(Boolean)
        .join(",");

      const record = makeCacheRecord(mergedItems, sourceLabel || "multi-source");
      NEWS_CACHE.set(NEWS_CACHE_KEY, record);

      return NextResponse.json(mergedItems, {
        headers: {
          "Cache-Control": "no-store",
          "x-news-cache": "MISS",
          "x-news-source": sourceLabel || "multi-source",
        },
      });
    }

    throw new Error("All news sources returned no rows");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown news error";
    console.error("News aggregation warning:", message);

    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "no-store",
          "x-news-cache": "STALE",
          "x-news-source": cached.source,
          "x-news-fallback-reason": "stale-cache",
        },
      });
    }

    const fallback = fallbackNewsItems();
    NEWS_CACHE.set(NEWS_CACHE_KEY, makeCacheRecord(fallback, "local-fallback"));
    return NextResponse.json(fallback, {
      headers: {
        "Cache-Control": "no-store",
        "x-news-cache": "MISS",
        "x-news-source": "local-fallback",
        "x-news-fallback-reason": "all-sources-failed",
      },
    });
  } finally {
    for (const [key, value] of NEWS_CACHE.entries()) {
      if (Date.now() - value.createdAt > SCRAPER_TTL_MS * 6) NEWS_CACHE.delete(key);
    }
  }
}
