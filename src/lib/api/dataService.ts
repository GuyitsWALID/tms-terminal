// This is a service layer for fetching and parsing data.
// Since we cannot run a full Puppeteer/Playwright instance in the browser,
// we implement this as a server-side utility or a proxy fetch.

import type { EconomicEvent } from "@/types";
import type { NewsItem } from "@/types/api";

export type LiveTickerSymbol = "EURUSD" | "GBPUSD" | "USDJPY" | "AUDUSD" | "USDCAD" | "XAUUSD";

export type LiveTicker = {
  symbol: LiveTickerSymbol;
  price: string;
  change: string;
  isUp: boolean;
};

export type LiveTickerResponse = {
  tickers: LiveTicker[];
  source: string;
  cache: string;
  fallbackReason: string;
};

export type EconomicCalendarResponse = {
  events: EconomicEvent[];
  source: string;
  cache: string;
  fallbackReason: string;
};

export type EconomicCalendarFetchOptions = {
  date?: Date;
  scope?: "week" | "day" | "month";
};

export async function fetchEconomicCalendarWithMeta(options?: EconomicCalendarFetchOptions): Promise<EconomicCalendarResponse> {
  const { date, scope = "week" } = options ?? {};
  const url = new URL("/api/calendar", window.location.origin);

  url.searchParams.set("scope", scope);
  url.searchParams.set("tz_offset", "3");

  if (date) {
    url.searchParams.set("year", String(date.getFullYear()));
    url.searchParams.set("month", String(date.getMonth() + 1));
    url.searchParams.set("day", String(date.getDate()));
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Calendar fetch failed");
  const events = (await res.json()) as EconomicEvent[];

  return {
    events,
    source: res.headers.get("x-calendar-source") ?? "unknown",
    cache: res.headers.get("x-calendar-cache") ?? "unknown",
    fallbackReason: res.headers.get("x-calendar-fallback-reason") ?? "",
  };
}

export async function fetchEconomicCalendar(date?: Date) {
  const result = await fetchEconomicCalendarWithMeta({ date });
  return result.events;
}

export async function fetchNewsFeed() {
  const res = await fetch("/api/news", { cache: "no-store" });
  if (!res.ok) throw new Error("News fetch failed");
  return (await res.json()) as NewsItem[];
}

export async function fetchLiveTickersWithMeta(): Promise<LiveTickerResponse> {
  const res = await fetch("/api/tickers", { cache: "no-store" });
  if (!res.ok) throw new Error("Ticker fetch failed");
  const tickers = (await res.json()) as LiveTicker[];

  return {
    tickers,
    source: res.headers.get("x-ticker-source") ?? "unknown",
    cache: res.headers.get("x-ticker-cache") ?? "unknown",
    fallbackReason: res.headers.get("x-ticker-fallback-reason") ?? "",
  };
}

export async function fetchLiveTickers() {
  const result = await fetchLiveTickersWithMeta();
  return result.tickers;
}
