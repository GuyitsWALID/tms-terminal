import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { calendarEvents } from "@/lib/terminalData";
import {
  SCRAPER_TTL_MS,
  fetchWithTimeout,
  isCacheFresh,
  makeCacheRecord,
  normalizeText,
  safeId,
  type CacheRecord,
} from "@/lib/api/scraperUtils";
import { getMonthJobCachedRows, triggerMonthScrapeJob } from "@/lib/api/calendarMonthJob";
import { MARKET_CALENDAR_CURRENCIES, MARKET_KEYWORDS, normalizeMarket } from "@/lib/market";
import { buildCalendarEventKey } from "@/lib/calendarEventKey";
import type { MarketKey } from "@/types";

type CalendarApiEvent = {
  id: string;
  eventKey?: string;
  time: string;
  eventDate?: string;
  currency: string;
  event: string;
  detailId?: string;
  scrapedDetail?: {
    source?: string;
    usualEffect?: string;
    frequency?: string;
    nextRelease?: string;
    ffNotes?: string;
    whyTradersCare?: string;
  };
  actual: string;
  forecast: string;
  previous: string;
  impact: "high" | "medium" | "low";
  isStarred: boolean;
};

type ExportCalendarEvent = CalendarApiEvent & { dateKey: string };

const FOREX_FACTORY_EXPORT_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
const CACHE_VERSION = "v3";
const CACHE = new Map<string, CacheRecord<CalendarApiEvent[]>>();
const EXPORT_CACHE = new Map<string, CacheRecord<ExportCalendarEvent[]>>();
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toTwoDigits = (value: string | number) => String(Number(value)).padStart(2, "0");

const toTargetDate = (year: string, month: string, day: string) => `${toTwoDigits(month)}-${toTwoDigits(day)}-${year}`;

const parseDateKey = (dateKey: string) => {
  const [month, day, year] = dateKey.split("-").map((value) => Number(value));
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const dateKeyToIso = (dateKey: string) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return "";
  return `${parsed.year}-${toTwoDigits(parsed.month)}-${toTwoDigits(parsed.day)}`;
};

const toDateLabel = (dateKey: string) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  return `${monthLabels[Math.max(0, parsed.month - 1)]} ${parsed.day}`;
};

const parseImpact = (raw: string) => {
  const lower = raw.toLowerCase();
  if (/(high|red|icon--ff-impact-red)/.test(lower)) return "high" as const;
  if (/(medium|orange|icon--ff-impact-ora)/.test(lower)) return "medium" as const;
  return "low" as const;
};

const getAdjustedDateIso = (dateKey: string, timeValue: string, tzOffset: number) => {
  const parsedDate = parseDateKey(dateKey);
  if (!parsedDate) return dateKeyToIso(dateKey);

  const raw = normalizeText(timeValue);
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);

  if (!match) {
    return `${parsedDate.year}-${toTwoDigits(parsedDate.month)}-${toTwoDigits(parsedDate.day)}`;
  }

  const [, hourRaw, minuteRaw, ampm] = match;
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (ampm.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

  const utcDate = new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, hour, minute));
  utcDate.setUTCHours(utcDate.getUTCHours() + tzOffset);

  return `${utcDate.getUTCFullYear()}-${toTwoDigits(utcDate.getUTCMonth() + 1)}-${toTwoDigits(utcDate.getUTCDate())}`;
};

const adjustTimeToOffset = (dateKey: string, timeValue: string, tzOffset: number, withDateLabel: boolean) => {
  const raw = normalizeText(timeValue);
  if (!raw || raw === "-") return withDateLabel ? `${toDateLabel(dateKey)} -` : "-";

  const parsedDate = parseDateKey(dateKey);
  if (!parsedDate) return withDateLabel ? `${dateKey} ${raw}` : raw;

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    return withDateLabel ? `${toDateLabel(dateKey)} ${raw}` : raw;
  }

  const [, hourRaw, minuteRaw, ampm] = match;
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (ampm.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

  const utcDate = new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, hour, minute));
  utcDate.setUTCHours(utcDate.getUTCHours() + tzOffset);

  const timeLabel = utcDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  if (!withDateLabel) return timeLabel;
  return `${monthLabels[utcDate.getUTCMonth()]} ${utcDate.getUTCDate()} ${timeLabel}`;
};

const parseForexFactoryExport = (raw: string) => {
  const xmlStart = raw.indexOf("<?xml");
  if (xmlStart < 0) {
    throw new Error("ForexFactory export XML not found in response");
  }

  const xmlPayload = raw.slice(xmlStart);
  const $ = cheerio.load(xmlPayload, { xmlMode: true });
  const items: ExportCalendarEvent[] = [];

  $("event").each((index, element) => {
    const row = $(element);

    const title = normalizeText(row.find("title").text());
    const country = normalizeText(row.find("country").text()) || "N/A";
    const dateKey = normalizeText(row.find("date").text());
    const time = normalizeText(row.find("time").text()) || "All Day";
    const impact = parseImpact(normalizeText(row.find("impact").text()));
    const forecast = normalizeText(row.find("forecast").text()) || "-";
    const previous = normalizeText(row.find("previous").text()) || "-";
    const actual = normalizeText(row.find("actual").text()) || "-";

    if (!title || !country || country === "N/A" || !dateKey) return;

    items.push({
      id: safeId(`${country}-${title}-${dateKey}-${time}`, index),
      time,
      eventDate: dateKeyToIso(dateKey),
      currency: country,
      event: title,
      actual,
      forecast,
      previous,
      impact,
      isStarred: false,
      dateKey,
    });
  });

  if (!items.length) {
    throw new Error("ForexFactory export parser returned no rows");
  }

  return items;
};

const toClientRows = (rows: ExportCalendarEvent[], tzOffset: number, includeDateInTime: boolean): CalendarApiEvent[] =>
  rows.map((row) => {
    const { dateKey, ...base } = row;
    const eventDate = getAdjustedDateIso(dateKey, row.time, tzOffset);
    return {
      ...base,
      eventDate,
      time: adjustTimeToOffset(dateKey, row.time, tzOffset, includeDateInTime),
      eventKey: buildCalendarEventKey({
        eventDate,
        currency: row.currency,
        event: row.event,
        impact: row.impact,
      }),
    };
  });

const fallbackCalendarEvents = (year: string, month: string, day: string): CalendarApiEvent[] => {
  const isoDate = `${year}-${toTwoDigits(month)}-${toTwoDigits(day)}`;
  return calendarEvents.map((event) => ({
    id: event.id,
    eventKey: buildCalendarEventKey({
      eventDate: isoDate,
      currency: event.currency,
      event: event.event,
      impact: event.impact,
    }),
    time: event.time,
    eventDate: isoDate,
    currency: event.currency,
    event: event.event,
    actual: event.actual,
    forecast: event.forecast,
    previous: event.previous,
    impact: event.impact,
    isStarred: event.isStarred,
  }));
};

const readExportFeed = async () => {
  const exportCached = EXPORT_CACHE.get("ff-weekly-export");
  if (exportCached && isCacheFresh(exportCached)) return exportCached.data;

  const response = await fetchWithTimeout(FOREX_FACTORY_EXPORT_URL, 15000);
  if (!response.ok) {
    throw new Error(`ForexFactory export request failed (${response.status})`);
  }

  const raw = await response.text();
  const datedItems = parseForexFactoryExport(raw);

  // Shorter refresh window for planned events updates.
  EXPORT_CACHE.set("ff-weekly-export", {
    data: datedItems,
    source: "forexfactory-export",
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return datedItems;
};

const filterExportByScope = (
  rows: ExportCalendarEvent[],
  scope: "day" | "week" | "month",
  year: string,
  month: string,
  day: string
) => {
  if (scope === "week") return rows;

  if (scope === "month") {
    return rows.filter((item) => {
      const parsed = parseDateKey(item.dateKey);
      if (!parsed) return false;
      return parsed.year === Number(year) && parsed.month === Number(month);
    });
  }

  const targetDate = toTargetDate(year, month, day);
  return rows.filter((item) => item.dateKey === targetDate);
};

const filterCalendarByMarket = (rows: CalendarApiEvent[], market: MarketKey) => {
  if (market === "forex") return { rows, usedGenericFallback: false };

  const allowedCurrencies = MARKET_CALENDAR_CURRENCIES[market];
  const keywords = MARKET_KEYWORDS[market];

  const scoped = rows.filter((event) => {
    const currencyMatch = allowedCurrencies.includes(event.currency.toUpperCase());
    const keywordHaystack = `${event.event} ${event.currency}`.toLowerCase();
    const keywordMatch = keywords.some((keyword) => keywordHaystack.includes(keyword));
    return currencyMatch || keywordMatch;
  });

  if (scoped.length > 0) return { rows: scoped, usedGenericFallback: false };

  return { rows, usedGenericFallback: true };
};

export async function GET(request: NextRequest) {
  const now = new Date();
  const search = request.nextUrl.searchParams;

  const requestedYear = search.get("year") ?? String(now.getUTCFullYear());
  const requestedMonth = search.get("month") ?? String(now.getUTCMonth() + 1);
  const requestedDay = search.get("day") ?? String(now.getUTCDate());
  const rawScope = search.get("scope") ?? "week";
  const scope: "day" | "week" | "month" = rawScope === "day" || rawScope === "month" ? rawScope : "week";
  const tzOffset = Number(search.get("tz_offset") ?? "3");
  const market = normalizeMarket(search.get("market"));

  // Month scope is always pinned to the real current month.
  const year = scope === "month" ? String(now.getUTCFullYear()) : requestedYear;
  const month = scope === "month" ? String(now.getUTCMonth() + 1) : requestedMonth;
  const day = scope === "month" ? String(now.getUTCDate()) : requestedDay;

  const cacheKey =
    scope === "month"
      ? `${CACHE_VERSION}-${year}-${month}-${scope}-${tzOffset}-${market}`
      : `${CACHE_VERSION}-${year}-${month}-${day}-${scope}-${tzOffset}-${market}`;

  const cached = CACHE.get(cacheKey);
  if (cached && isCacheFresh(cached)) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "no-store",
        "x-calendar-cache": "HIT",
        "x-calendar-source": cached.source,
      },
    });
  }

  try {
    if (scope === "month") {
      const monthJobRows = await getMonthJobCachedRows(Number(year), Number(month));
      if (monthJobRows?.data.length) {
        const monthResult = toClientRows(monthJobRows.data as ExportCalendarEvent[], tzOffset, true);
        const { rows: marketRows, usedGenericFallback } = filterCalendarByMarket(monthResult, market);
        CACHE.set(cacheKey, makeCacheRecord(marketRows, "forexfactory-playwright-month"));
        return NextResponse.json(marketRows, {
          headers: {
            "Cache-Control": "no-store",
            "x-calendar-cache": "MISS",
            "x-calendar-source": "forexfactory-playwright-month",
            "x-calendar-market": market,
            ...(usedGenericFallback ? { "x-calendar-fallback-reason": "market-generic-fallback" } : {}),
          },
        });
      }

      // Fire and forget: full-month scrape job refreshes cache in background.
      triggerMonthScrapeJob(Number(year), Number(month));

      return NextResponse.json([], {
        status: 202,
        headers: {
          "Cache-Control": "no-store",
          "x-calendar-cache": "MISS",
          "x-calendar-source": "forexfactory-playwright-month",
          "x-calendar-fallback-reason": "month-job-pending",
          "x-calendar-market": market,
        },
      });
    }

    const exportedRows = await readExportFeed();
    const scopedRows = filterExportByScope(exportedRows, scope, year, month, day);

    const includeDateInTime = scope !== "day";
    const result = toClientRows(scopedRows, tzOffset, includeDateInTime);
    const { rows: marketRows, usedGenericFallback } = filterCalendarByMarket(result, market);

    if (marketRows.length > 0) {
      CACHE.set(cacheKey, makeCacheRecord(marketRows, "forexfactory-export"));
      return NextResponse.json(marketRows, {
        headers: {
          "Cache-Control": "no-store",
          "x-calendar-cache": "MISS",
          "x-calendar-source": "forexfactory-export",
          "x-calendar-market": market,
          ...(usedGenericFallback ? { "x-calendar-fallback-reason": "market-generic-fallback" } : {}),
        },
      });
    }

    return NextResponse.json([], {
      headers: {
        "Cache-Control": "no-store",
        "x-calendar-cache": "MISS",
        "x-calendar-source": "forexfactory-export",
        "x-calendar-market": market,
      },
    });
  } catch (exportError: unknown) {
    const exportMessage = exportError instanceof Error ? exportError.message : "export feed failed";
    console.error("Calendar export warning:", exportMessage);

    if (scope === "month") {
      return NextResponse.json(
        {
          error: "Month scrape failed",
          detail: exportMessage,
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "x-calendar-cache": "MISS",
            "x-calendar-source": "forexfactory-playwright-month",
            "x-calendar-fallback-reason": "month-job-failed",
            "x-calendar-market": market,
          },
        }
      );
    }

    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "no-store",
          "x-calendar-cache": "STALE",
          "x-calendar-source": cached.source,
          "x-calendar-fallback-reason": "stale-cache",
          "x-calendar-market": market,
        },
      });
    }

    const fallback = fallbackCalendarEvents(year, month, day);
    CACHE.set(cacheKey, makeCacheRecord(fallback, "local-fallback"));

    return NextResponse.json(fallback, {
      headers: {
        "Cache-Control": "no-store",
        "x-calendar-cache": "MISS",
        "x-calendar-source": "local-fallback",
        "x-calendar-fallback-reason": "forexfactory-export-unavailable",
        "x-calendar-market": market,
      },
    });
  } finally {
    for (const [key, value] of CACHE.entries()) {
      if (Date.now() - value.createdAt > SCRAPER_TTL_MS * 6) CACHE.delete(key);
    }
  }
}
