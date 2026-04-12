// This is a service layer for fetching and parsing data.
// Since we cannot run a full Puppeteer/Playwright instance in the browser,
// we implement this as a server-side utility or a proxy fetch.

import type { EconomicEvent } from "@/types";
import type { NewsItem } from "@/types/api";

export type EconomicCalendarResponse = {
  events: EconomicEvent[];
  source: string;
  cache: string;
  fallbackReason: string;
};

export async function fetchEconomicCalendarWithMeta(date?: Date): Promise<EconomicCalendarResponse> {
  const url = new URL("/api/calendar", window.location.origin);

  url.searchParams.set("scope", "week");
  url.searchParams.set("tz_offset", "3");

  if (date) {
    url.searchParams.set("year", String(date.getUTCFullYear()));
    url.searchParams.set("month", String(date.getUTCMonth() + 1));
    url.searchParams.set("day", String(date.getUTCDate()));
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
  const result = await fetchEconomicCalendarWithMeta(date);
  return result.events;
}

export async function fetchNewsFeed() {
  const res = await fetch("/api/news", { cache: "no-store" });
  if (!res.ok) throw new Error("News fetch failed");
  return (await res.json()) as NewsItem[];
}
