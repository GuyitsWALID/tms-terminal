// This is a service layer for fetching and parsing data.
// Since we cannot run a full Puppeteer/Playwright instance in the browser,
// we implement this as a server-side utility or a proxy fetch.

import type { EconomicEvent } from "@/types";
import type { NewsItem } from "@/types/api";

export async function fetchEconomicCalendar() {
  const res = await fetch("/api/calendar", { cache: "no-store" });
  if (!res.ok) throw new Error("Calendar fetch failed");
  return (await res.json()) as EconomicEvent[];
}

export async function fetchNewsFeed() {
  const res = await fetch("/api/news", { cache: "no-store" });
  if (!res.ok) throw new Error("News fetch failed");
  return (await res.json()) as NewsItem[];
}
