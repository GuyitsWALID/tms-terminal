import { NextRequest, NextResponse } from "next/server";
import { calendarEvents } from "@/lib/terminalData";

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

const readField = (row: Record<string, unknown>, keys: string[], fallback = "-") => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
};

const parseImpact = (row: Record<string, unknown>): CalendarApiEvent["impact"] => {
  const raw = ["impact", "impact_level", "volatility", "importance"]
    .map((key) => row[key])
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

  const redBars = (raw.match(/red|high|\uD83D\uDFE5/g) || []).length;
  const orangeBars = (raw.match(/orange|med|moderate|\uD83D\uDFE7/g) || []).length;

  if (raw.includes("high") || redBars >= 2) return "high";
  if (raw.includes("medium") || raw.includes("med") || orangeBars >= 2) return "medium";
  return "low";
};

const normalizePayload = (payload: unknown): CalendarApiEvent[] => {
  const root = (payload ?? {}) as Record<string, unknown>;
  const candidates = [
    root,
    (root.data ?? null) as Record<string, unknown> | null,
    (root.result ?? null) as Record<string, unknown> | null,
  ].filter(Boolean) as Record<string, unknown>[];

  let rows: unknown[] = [];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      rows = candidate;
      break;
    }
    if (Array.isArray(candidate.events)) {
      rows = candidate.events;
      break;
    }
    if (Array.isArray(candidate.calendar)) {
      rows = candidate.calendar;
      break;
    }
    if (Array.isArray(candidate.results)) {
      rows = candidate.results;
      break;
    }
  }

  if (!rows.length && Array.isArray(payload)) rows = payload;

  return rows
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const currency = readField(row, ["currency", "currency_code", "ccy"], "N/A");
      const event = readField(row, ["event", "event_name", "title", "name"], "Untitled Event");
      const time = readField(row, ["time", "event_time", "date_time", "datetime"], "All Day");

      const idSource = readField(row, ["id", "event_id", "timestamp"], `${currency}-${event}-${index}`);
      const safeId = idSource.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();

      return {
        id: safeId || `event-${index}`,
        time,
        currency,
        event,
        actual: readField(row, ["actual", "actual_value"], "-"),
        forecast: readField(row, ["forecast", "forecast_value", "consensus"], "-"),
        previous: readField(row, ["previous", "previous_value", "prior"], "-"),
        impact: parseImpact(row),
        isStarred: false,
      } satisfies CalendarApiEvent;
    })
    .filter((event) => Boolean(event.currency && event.event));
};

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(fallbackCalendarEvents(), {
        headers: {
          "x-calendar-source": "fallback",
          "x-calendar-fallback-reason": "missing-api-key",
          "Cache-Control": "no-store",
        },
      });
    }

    const now = new Date();
    const search = request.nextUrl.searchParams;
    const year = search.get("year") ?? String(now.getUTCFullYear());
    const month = search.get("month") ?? String(now.getUTCMonth() + 1);
    const day = search.get("day") ?? String(now.getUTCDate());
    const currency = search.get("currency") ?? "ALL";
    const eventName = search.get("event_name") ?? "ALL";
    const timezone = search.get("timezone") ?? "GMT+00:00";
    const timeFormat = search.get("time_format") ?? "24h";

    const url = new URL(`${RAPIDAPI_BASE_URL}/get_calendar_details`);
    url.searchParams.set("year", year);
    url.searchParams.set("month", month);
    url.searchParams.set("day", day);
    url.searchParams.set("currency", currency);
    url.searchParams.set("event_name", eventName);
    url.searchParams.set("timezone", timezone);
    url.searchParams.set("time_format", timeFormat);

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const details = await upstream.text();
      console.error("Calendar provider request failed", { status: upstream.status, details });

      return NextResponse.json(fallbackCalendarEvents(), {
        headers: {
          "x-calendar-source": "fallback",
          "x-calendar-fallback-reason": `provider-${upstream.status}`,
          "Cache-Control": "no-store",
        },
      });
    }

    const payload = (await upstream.json()) as unknown;
    const normalized = normalizePayload(payload);

    return NextResponse.json(normalized, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("RapidAPI Calendar Error:", message);
    return NextResponse.json(fallbackCalendarEvents(), {
      headers: {
        "x-calendar-source": "fallback",
        "x-calendar-fallback-reason": "runtime-error",
        "Cache-Control": "no-store",
      },
    });
  }
}
