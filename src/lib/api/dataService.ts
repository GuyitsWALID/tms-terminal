// This is a service layer for fetching and parsing data.
// Since we cannot run a full Puppeteer/Playwright instance in the browser,
// we implement this as a server-side utility or a proxy fetch.

import type { EconomicEvent } from "@/types";
import type { NewsItem } from "@/types/api";
import type { MarketKey } from "@/types";
import type { PerspectiveBias, PerspectiveConsensus, VerifiedPerspective } from "@/types";
import type { AuthStatus } from "@/types";

export type LiveTickerSymbol = string;

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
  market?: MarketKey;
};

export type NewsFeedResponse = {
  news: NewsItem[];
  source: string;
  cache: string;
  fallbackReason: string;
};

export type VerifiedPerspectivesResponse = {
  perspectives: VerifiedPerspective[];
  consensus: PerspectiveConsensus[];
};

export async function fetchEconomicCalendarWithMeta(options?: EconomicCalendarFetchOptions): Promise<EconomicCalendarResponse> {
  const { date, scope = "week", market = "forex" } = options ?? {};
  const url = new URL("/api/calendar", window.location.origin);

  url.searchParams.set("scope", scope);
  url.searchParams.set("tz_offset", "3");
  url.searchParams.set("market", market);

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

export async function fetchNewsFeedWithMeta(market: MarketKey = "forex"): Promise<NewsFeedResponse> {
  const url = new URL("/api/news", window.location.origin);
  url.searchParams.set("market", market);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("News fetch failed");
  const news = (await res.json()) as NewsItem[];

  return {
    news,
    source: res.headers.get("x-news-source") ?? "unknown",
    cache: res.headers.get("x-news-cache") ?? "unknown",
    fallbackReason: res.headers.get("x-news-fallback-reason") ?? "",
  };
}

export async function fetchNewsFeed(market: MarketKey = "forex") {
  const result = await fetchNewsFeedWithMeta(market);
  return result.news;
}

export async function fetchLiveTickersWithMeta(market: MarketKey = "forex"): Promise<LiveTickerResponse> {
  const url = new URL("/api/tickers", window.location.origin);
  url.searchParams.set("market", market);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Ticker fetch failed");
  const tickers = (await res.json()) as LiveTicker[];

  return {
    tickers,
    source: res.headers.get("x-ticker-source") ?? "unknown",
    cache: res.headers.get("x-ticker-cache") ?? "unknown",
    fallbackReason: res.headers.get("x-ticker-fallback-reason") ?? "",
  };
}

export async function fetchLiveTickers(market: MarketKey = "forex") {
  const result = await fetchLiveTickersWithMeta(market);
  return result.tickers;
}

export async function fetchVerifiedPerspectives(eventKey: string | undefined, market: MarketKey): Promise<VerifiedPerspectivesResponse> {
  const url = new URL("/api/verified-perspectives", window.location.origin);
  if (eventKey) {
    url.searchParams.set("eventKey", eventKey);
  }
  url.searchParams.set("market", market);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Verified perspectives fetch failed");
  return (await res.json()) as VerifiedPerspectivesResponse;
}

export type CreateVerifiedPerspectiveInput = {
  eventKey: string;
  market: MarketKey;
  eventDate: string;
  currency: string;
  eventTitle: string;
  impact: "high" | "medium" | "low";
  bias: PerspectiveBias;
  confidence: number;
  thesis: string;
  analystDesk?: string;
};

export async function createVerifiedPerspective(input: CreateVerifiedPerspectiveInput): Promise<VerifiedPerspective> {
  const url = new URL("/api/verified-perspectives", window.location.origin);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({ error: "Unable to submit perspective" }))) as { error?: string };
    throw new Error(payload.error ?? "Unable to submit perspective");
  }

  const payload = (await res.json()) as { perspective: VerifiedPerspective };
  return payload.perspective;
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const url = new URL("/api/auth/status", window.location.origin);
  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    return { isAuthenticated: false };
  }

  return (await res.json()) as AuthStatus;
}

export async function redeemAnalystInviteCode(code: string): Promise<AuthStatus> {
  const url = new URL("/api/auth/redeem-invite", window.location.origin);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({ error: "Unable to redeem invite code" }))) as { error?: string };
    throw new Error(payload.error ?? "Unable to redeem invite code");
  }

  return (await res.json()) as AuthStatus;
}
