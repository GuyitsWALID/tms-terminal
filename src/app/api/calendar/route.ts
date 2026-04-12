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
  eventDate?: string;
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
const FOREX_FACTORY_EXPORT_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
const CACHE = new Map<string, CacheRecord<CalendarApiEvent[]>>();
type ExportCalendarEvent = CalendarApiEvent & { dateKey: string };
const EXPORT_CACHE = new Map<string, CacheRecord<ExportCalendarEvent[]>>();
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

const toTwoDigits = (value: string) => String(Number(value)).padStart(2, "0");

const toTargetDate = (year: string, month: string, day: string) => `${toTwoDigits(month)}-${toTwoDigits(day)}-${year}`;

const toIsoDate = (year: string, month: string, day: string) => `${year}-${toTwoDigits(month)}-${toTwoDigits(day)}`;

const parseDateKey = (dateKey: string) => {
  const [month, day, year] = dateKey.split("-").map((value) => Number(value));
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const toDateLabel = (dateKey: string) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  return `${monthLabels[Math.max(0, parsed.month - 1)]} ${parsed.day}`;
};

const dateKeyToIso = (dateKey: string) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return "";
  return `${parsed.year}-${toTwoDigits(String(parsed.month))}-${toTwoDigits(String(parsed.day))}`;
};

const getAdjustedDateIso = (dateKey: string, timeValue: string, tzOffset: number) => {
  const parsedDate = parseDateKey(dateKey);
  if (!parsedDate) return dateKeyToIso(dateKey);

  const raw = normalizeText(timeValue);
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);

  if (!match) {
    return `${parsedDate.year}-${toTwoDigits(String(parsedDate.month))}-${toTwoDigits(String(parsedDate.day))}`;
  }

  const [, hourRaw, minuteRaw, ampm] = match;
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (ampm.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

  const utcDate = new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, hour, minute));
  utcDate.setUTCHours(utcDate.getUTCHours() + tzOffset);

  return `${utcDate.getUTCFullYear()}-${toTwoDigits(String(utcDate.getUTCMonth() + 1))}-${toTwoDigits(String(utcDate.getUTCDate()))}`;
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

  const adjustedDateLabel = `${monthLabels[utcDate.getUTCMonth()]} ${utcDate.getUTCDate()}`;
  return `${adjustedDateLabel} ${timeLabel}`;
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

    if (!title || !country || country === "N/A") return;

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

const stripExportDate = (rows: ExportCalendarEvent[], tzOffset: number, includeDateInTime: boolean): CalendarApiEvent[] =>
  rows.map((row) => {
    const { dateKey, ...base } = row;
    const trimmed: CalendarApiEvent = {
      ...base,
      eventDate: getAdjustedDateIso(dateKey, row.time, tzOffset),
      time: adjustTimeToOffset(dateKey, row.time, tzOffset, includeDateInTime),
    };
    return trimmed;
  });

const fetchForexFactoryExportCalendar = async (
  year: string,
  month: string,
  day: string,
  scope: "day" | "week",
  tzOffset: number
) => {
  const exportCached = EXPORT_CACHE.get("ff-weekly-export");
  const requestedDate = toTargetDate(year, month, day);
  const includeDateInTime = scope === "week";

  if (exportCached && isCacheFresh(exportCached)) {
    if (scope === "week") {
      return stripExportDate(exportCached.data, tzOffset, includeDateInTime);
    }
    const filtered = exportCached.data.filter((item) => item.dateKey === requestedDate);
    return filtered.length
      ? stripExportDate(filtered, tzOffset, includeDateInTime)
      : stripExportDate(exportCached.data, tzOffset, includeDateInTime);
  }

  const response = await fetchWithTimeout(FOREX_FACTORY_EXPORT_URL, 15000);
  if (!response.ok) {
    throw new Error(`ForexFactory export request failed (${response.status})`);
  }

  const raw = await response.text();
  const datedItems = parseForexFactoryExport(raw);

  // ForexFactory states export updates hourly; cache for one hour to avoid blocks.
  EXPORT_CACHE.set("ff-weekly-export", {
    data: datedItems,
    source: "forexfactory-export",
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  if (scope === "week") {
    return stripExportDate(datedItems, tzOffset, includeDateInTime);
  }

  const filtered = datedItems.filter((item) => item.dateKey === requestedDate);
  return filtered.length
    ? stripExportDate(filtered, tzOffset, includeDateInTime)
    : stripExportDate(datedItems, tzOffset, includeDateInTime);
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
      eventDate: toIsoDate(year, month, day),
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

const normalizeRapidApiPayload = (payload: unknown, year: string, month: string, day: string): CalendarApiEvent[] => {
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
        eventDate: toIsoDate(year, month, day),
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
  return normalizeRapidApiPayload(payload, year, month, day);
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
  const scope = (search.get("scope") ?? "week") === "day" ? "day" : "week";
  const tzOffset = Number(search.get("tz_offset") ?? "3");

  const cacheKey = `${year}-${month}-${day}-${currency}-${eventName}-${timezone}-${timeFormat}-${scope}-${tzOffset}`;
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
    try {
      const exported = await fetchForexFactoryExportCalendar(year, month, day, scope, tzOffset);
      if (exported.length > 0) {
        const fresh = makeCacheRecord(exported, "forexfactory-export");
        CACHE.set(cacheKey, fresh);

        return NextResponse.json(exported, {
          headers: {
            "Cache-Control": "no-store",
            "x-calendar-cache": "MISS",
            "x-calendar-source": "forexfactory-export",
          },
        });
      }
    } catch (exportError: unknown) {
      const exportMessage = exportError instanceof Error ? exportError.message : "export feed failed";
      console.error("Calendar export warning:", exportMessage);
    }

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
