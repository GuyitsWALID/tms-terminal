import * as cheerio from "cheerio";
import type { MarketKey } from "@/types";
import { analyzeSentiment, fetchWithTimeout, inferImpactFromText, normalizeText, safeId } from "@/lib/api/scraperUtils";

export type FinancialJuiceNewsItem = {
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
  url?: string;
};

export type FinancialJuiceSourceResult = {
  source: "financialjuice-home" | "telegram" | "none";
  usedFallback: boolean;
  fallbackReason: string;
  items: FinancialJuiceNewsItem[];
};

type SourceState = {
  directFailures: number;
  directCooldownUntil: number;
};

declare global {
  var __tmsFinancialJuiceSourceState: SourceState | undefined;
}

const TELEGRAM_URL = process.env.FINANCIAL_JUICE_TELEGRAM_URL ?? "https://t.me/s/FinancialJuice";
const FJ_HOME_URL = process.env.FINANCIAL_JUICE_HOME_URL ?? "https://www.financialjuice.com/home";
const DIRECT_COOLDOWN_MS = Number(process.env.FINANCIAL_JUICE_DIRECT_COOLDOWN_MS ?? 60000);

const getSourceState = (): SourceState => {
  if (!globalThis.__tmsFinancialJuiceSourceState) {
    globalThis.__tmsFinancialJuiceSourceState = {
      directFailures: 0,
      directCooldownUntil: 0,
    };
  }

  return globalThis.__tmsFinancialJuiceSourceState;
};

type FinancialJuiceStartupPayload = {
  News?: Array<{
    NewsID?: number;
    Title?: string;
    PostedShort?: string;
    PostedLong?: string;
    DatePublished?: string;
    EURL?: string;
    HasE?: boolean;
    TypeID?: string;
    Breaking?: boolean;
  }>;
};

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const extractStartupConfigFromHome = (html: string) => {
  const info = html.match(/var\s+info\s*=\s*'([^']+)'/)?.[1] ?? "";
  const mainUrl = html.match(/var\s+MainURLData\s*=\s*'([^']+)'/)?.[1] ?? "";

  if (!info || !mainUrl) {
    throw new Error("Unable to extract FinancialJuice startup config");
  }

  return { info, mainUrl: mainUrl.replace(/\/+$/, "") };
};

const fetchFinancialJuiceStartupFeed = async (): Promise<FinancialJuiceStartupPayload> => {
  const homeResponse = await fetchWithTimeout(FJ_HOME_URL, 14000);
  if (!homeResponse.ok) {
    throw new Error(`FinancialJuice home request failed (${homeResponse.status})`);
  }

  const homeHtml = await homeResponse.text();
  const { info, mainUrl } = extractStartupConfigFromHome(homeHtml);

  const startupUrl = new URL(`${mainUrl}/FJService.asmx/Startup`);
  startupUrl.searchParams.set("info", `"${info}"`);
  startupUrl.searchParams.set("TimeOffset", "0");
  startupUrl.searchParams.set("tabID", "0");
  startupUrl.searchParams.set("oldID", "0");
  startupUrl.searchParams.set("TickerID", "0");
  startupUrl.searchParams.set("FeedCompanyID", "0");
  startupUrl.searchParams.set("strSearch", "");
  startupUrl.searchParams.set("extraNID", "0");

  const startupResponse = await fetchWithTimeout(startupUrl.toString(), 14000);
  if (!startupResponse.ok) {
    throw new Error(`FinancialJuice startup request failed (${startupResponse.status})`);
  }

  const startupXml = await startupResponse.text();
  const jsonPayload = startupXml.match(/<string[^>]*>([\s\S]*)<\/string>/i)?.[1] ?? "";
  if (!jsonPayload) {
    throw new Error("FinancialJuice startup payload missing JSON");
  }

  return JSON.parse(decodeXmlEntities(jsonPayload)) as FinancialJuiceStartupPayload;
};

const parseFinancialJuiceHome = async (): Promise<FinancialJuiceNewsItem[]> => {
  const payload = await fetchFinancialJuiceStartupFeed();
  const newsRows = payload.News ?? [];

  const rows: FinancialJuiceNewsItem[] = newsRows.map((entry, index) => {
    const headline = normalizeText(entry.Title);
    const publishedDate = entry.DatePublished ? new Date(entry.DatePublished) : new Date();
    const publishedAt = Number.isNaN(publishedDate.getTime()) ? new Date().toISOString() : publishedDate.toISOString();
    const postedLabel = normalizeText(entry.PostedLong) || normalizeText(entry.PostedShort);
    const { sentiment, score } = analyzeSentiment(headline);
    const sourcePostId = String(entry.NewsID ?? safeId(`${headline}-${publishedAt}`, index));

    return {
      id: `fj-home-${sourcePostId}`,
      sourcePostId,
      timestamp:
        postedLabel ||
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date(publishedAt)),
      publishedAt,
      headline,
      impact: inferImpactFromText(headline),
      sentiment,
      sentimentScore: score,
      source: "Financial Juice",
      category: entry.Breaking ? "Breaking" : "Live Wire",
      url: entry.HasE ? entry.EURL : FJ_HOME_URL,
    };
  }).filter((row) => row.headline.length >= 8);

  const deduped = new Map<string, FinancialJuiceNewsItem>();
  rows.forEach((row) => {
    const key = normalizeText(row.headline).toLowerCase();
    if (!key) return;
    if (!deduped.has(key)) {
      deduped.set(key, row);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
};

const parseFinancialJuiceTelegram = async (): Promise<FinancialJuiceNewsItem[]> => {
  const response = await fetchWithTimeout(TELEGRAM_URL, 12000);
  if (!response.ok) {
    throw new Error(`Telegram request failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rows: FinancialJuiceNewsItem[] = [];

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
      timestamp: new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(publishedAt)),
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

export const fetchFinancialJuiceWithFallback = async (_market: MarketKey): Promise<FinancialJuiceSourceResult> => {
  void _market;
  const state = getSourceState();
  const now = Date.now();

  const applyMarket = (items: FinancialJuiceNewsItem[]) => ({
    items: items.slice(0, 40),
    usedGenericFallback: false,
  });

  if (now >= state.directCooldownUntil) {
    try {
      const directResult = applyMarket(await parseFinancialJuiceHome());
      const direct = directResult.items;

      if (direct.length > 0) {
        state.directFailures = 0;
        state.directCooldownUntil = 0;
        return {
          source: "financialjuice-home",
          usedFallback: directResult.usedGenericFallback,
          fallbackReason: directResult.usedGenericFallback ? "market-generic-fallback" : "",
          items: direct,
        };
      }

      state.directFailures += 1;
      state.directCooldownUntil = Date.now() + DIRECT_COOLDOWN_MS;
    } catch {
      state.directFailures += 1;
      state.directCooldownUntil = Date.now() + DIRECT_COOLDOWN_MS;
    }
  }

  try {
    const telegramResult = applyMarket(await parseFinancialJuiceTelegram());
    const telegram = telegramResult.items;
    if (telegram.length > 0) {
      const baseReason = state.directCooldownUntil > now ? "direct-cooldown" : "direct-fetch-failed";
      const fallbackReason = telegramResult.usedGenericFallback ? `${baseReason},market-generic-fallback` : baseReason;
      return {
        source: "telegram",
        usedFallback: true,
        fallbackReason,
        items: telegram,
      };
    }
  } catch {
    // Fallback source failed as well.
  }

  return {
    source: "none",
    usedFallback: true,
    fallbackReason: "all-sources-failed",
    items: [],
  };
};
