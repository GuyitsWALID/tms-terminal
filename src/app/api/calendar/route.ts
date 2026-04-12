import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { calendarEvents } from "@/lib/terminalData";
import {
  SCRAPER_TTL_MS,
  fetchWithTimeout,
  inferImpactFromText,
  isCacheFresh,
  makeCacheRecord,
  normalizeText,
  safeId,
  type CacheRecord,
} from "@/lib/api/scraperUtils";

type CalendarApiEvent = {
  id: string;
  time: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: "high" | "medium" | "low";
  isStarred: boolean;
};

const RAPIDAPI_HOST = "forex-factory-scraper1.p.rapidapi.com";
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;
const CACHE = new Map<string, CacheRecord<CalendarApiEvent[]>>();

const fallbackCalendarEvents = (): CalendarApiEvent[] =>
  calendarEvents.map((event) => ({
    id: event.id,
    time: event.time,
    currency: event.currency,
    event: event.event,
    actual: event.actual,
    forecast: event.forecast,
    previous: event.previous,
    impact: event.impact,
    isStarred: event.isStarred,
  }));

const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const toForexFactoryDayParam = (year: string, month: string, day: string) => {
  const monthIndex = Number(month) - 1;
  const safeMonth = monthAbbr[monthIndex] ?? monthAbbr[new Date().getUTCMonth()];
  return `${safeMonth}${Number(day)}.${year}`;
};

const parseImpact = (raw: string) => {
  const lower = raw.toLowerCase();
  if (/(high|red|icon--ff-impact-red)/.test(lower)) return "high" as const;
  if (/(medium|orange|icon--ff-impact-ora)/.test(lower)) return "medium" as const;
  return "low" as const;
};

const scrapeForexFactoryCalendar = async (year: string, month: string, day: string) => {
  const dayParam = toForexFactoryDayParam(year, month, day);
  const url = `https://www.forexfactory.com/calendar?day=${dayParam}`;
  const response = await fetchWithTimeout(url, 15000);

  if (!response.ok) {
    throw new Error(`ForexFactory calendar request failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rows = $("tr.calendar__row, .calendar__row");

  const items: CalendarApiEvent[] = [];
  let carryTime = "All Day";
  let carryCurrency = "N/A";

  rows.each((index, element) => {
    const row = $(element);

    const rawTime = normalizeText(
      row.find(".calendar__time, td.calendar__time, [class*='calendar__time']").first().text()
    );
    const rawCurrency = normalizeText(
      row.find(".calendar__currency, td.calendar__currency, [class*='calendar__currency']").first().text()
    );
    const eventName = normalizeText(
      row
        .find(
          ".calendar__event-title, .calendar__event, td.calendar__event, [class*='calendar__event'] a, [class*='calendar__event'] span"
        )
        .first()
        .text()
    );

    if (rawTime) carryTime = rawTime;
    if (rawCurrency) carryCurrency = rawCurrency;

    if (!eventName || !carryCurrency || carryCurrency === "N/A") return;

    const impactText = `${
      row.find(".calendar__impact, [class*='calendar__impact']").attr("class") ?? ""
    } ${normalizeText(row.find(".calendar__impact, [class*='calendar__impact']").text())}`;

    const impact = parseImpact(impactText);
    const actual = normalizeText(
      row.find(".calendar__actual, td.calendar__actual, [class*='calendar__actual']").first().text()
    );
    const forecast = normalizeText(
      row.find(".calendar__forecast, td.calendar__forecast, [class*='calendar__forecast']").first().text()
    );
    const previous = normalizeText(
      row.find(".calendar__previous, td.calendar__previous, [class*='calendar__previous']").first().text()
    );

    const seed = `${carryCurrency}-${eventName}-${carryTime}`;
    items.push({
      id: safeId(seed, index),
      time: carryTime || "All Day",
      currency: carryCurrency,
      event: eventName,
      actual: actual || "-",
      forecast: forecast || "-",
      previous: previous || "-",
      impact,
      isStarred: false,
    });
  });

  if (items.length === 0) {
    throw new Error("ForexFactory calendar parser returned no rows");
  }

  return items;
};

const readField = (row: Record<string, unknown>, keys: string[], fallback = "-") => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
};

const normalizeRapidApiPayload = (payload: unknown): CalendarApiEvent[] => {
  const root = (payload ?? {}) as Record<string, unknown>;
  const rows =
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(root.events) && root.events) ||
    (Array.isArray(root.calendar) && root.calendar) ||
    (Array.isArray(payload) && payload) ||
    [];

  return rows
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const currency = readField(row, ["currency", "currency_code", "ccy"], "N/A");
      const event = readField(row, ["event", "event_name", "title", "name"], "Untitled Event");
      const time = readField(row, ["time", "event_time", "date_time", "datetime"], "All Day");
      const impact = inferImpactFromText(readField(row, ["impact", "impact_level", "importance"], "low"));

      return {
        id: safeId(`${currency}-${event}-${time}`, index),
        time,
        currency,
        event,
        actual: readField(row, ["actual", "actual_value"], "-"),
        forecast: readField(row, ["forecast", "forecast_value", "consensus"], "-"),
        previous: readField(row, ["previous", "previous_value", "prior"], "-"),
        impact,
        isStarred: false,
      } satisfies CalendarApiEvent;
    })
    .filter((row) => row.event && row.currency && row.currency !== "N/A");
};

const fetchRapidApiCalendar = async (
  year: string,
  month: string,
  day: string,
  currency: string,
  eventName: string,
  timezone: string,
  timeFormat: string
) => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];

  const url = new URL(`${RAPIDAPI_BASE_URL}/get_calendar_details`);
  url.searchParams.set("year", year);
  url.searchParams.set("month", month);
  url.searchParams.set("day", day);
  url.searchParams.set("currency", currency);
  url.searchParams.set("event_name", eventName);
  url.searchParams.set("timezone", timezone);
  url.searchParams.set("time_format", timeFormat);

  const upstream = await fetchWithTimeout(url.toString(), 12000, {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type": "application/json",
  });

  if (!upstream.ok) {
    throw new Error(`RapidAPI calendar request failed (${upstream.status})`);
  }

  const payload = (await upstream.json()) as unknown;
  return normalizeRapidApiPayload(payload);
};

export async function GET(request: NextRequest) {
  const now = new Date();
  const search = request.nextUrl.searchParams;

  const year = search.get("year") ?? String(now.getUTCFullYear());
  const month = search.get("month") ?? String(now.getUTCMonth() + 1);
  const day = search.get("day") ?? String(now.getUTCDate());
  const currency = search.get("currency") ?? "ALL";
  const eventName = search.get("event_name") ?? "ALL";
  const timezone = search.get("timezone") ?? "GMT+00:00";
  const timeFormat = search.get("time_format") ?? "24h";

  const cacheKey = `${year}-${month}-${day}-${currency}-${eventName}-${timezone}-${timeFormat}`;
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
    const scraped = await scrapeForexFactoryCalendar(year, month, day);
    const fresh = makeCacheRecord(scraped, "forexfactory");
    CACHE.set(cacheKey, fresh);

    return NextResponse.json(scraped, {
      headers: {
        "Cache-Control": "no-store",
        "x-calendar-cache": "MISS",
        "x-calendar-source": "forexfactory",
      },
    });
  } catch (scrapeError: unknown) {
    const scrapeMessage = scrapeError instanceof Error ? scrapeError.message : "calendar scrape failed";
    console.error("Calendar scraper warning:", scrapeMessage);

    try {
      const rapidItems = await fetchRapidApiCalendar(year, month, day, currency, eventName, timezone, timeFormat);
      if (rapidItems.length > 0) {
        const fresh = makeCacheRecord(rapidItems, "rapidapi");
        CACHE.set(cacheKey, fresh);
        return NextResponse.json(rapidItems, {
          headers: {
            "Cache-Control": "no-store",
            "x-calendar-cache": "MISS",
            "x-calendar-source": "rapidapi",
            "x-calendar-fallback-reason": "forexfactory-failed",
          },
        });
      }
    } catch (rapidError: unknown) {
      const rapidMessage = rapidError instanceof Error ? rapidError.message : "rapidapi failed";
      console.error("Calendar fallback warning:", rapidMessage);
    }

    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "no-store",
          "x-calendar-cache": "STALE",
          "x-calendar-source": cached.source,
          "x-calendar-fallback-reason": "stale-cache",
        },
      });
    }

    const fallback = fallbackCalendarEvents();
    CACHE.set(cacheKey, makeCacheRecord(fallback, "local-fallback"));

    return NextResponse.json(fallback, {
      headers: {
        "Cache-Control": "no-store",
        "x-calendar-cache": "MISS",
        "x-calendar-source": "local-fallback",
        "x-calendar-fallback-reason": "all-sources-failed",
      },
    });
  } finally {
    // Best-effort memory hygiene for serverless instances.
    for (const [key, value] of CACHE.entries()) {
      if (Date.now() - value.createdAt > SCRAPER_TTL_MS * 6) CACHE.delete(key);
    }
  }
}
