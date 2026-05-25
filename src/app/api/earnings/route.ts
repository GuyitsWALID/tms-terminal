import { NextResponse } from "next/server";
import type { EarningsEntry } from "@/types/api";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min
const CDN_CACHE_CONTROL = "public, s-maxage=120, stale-while-revalidate=600";

type CacheRecord = { data: EarningsEntry[]; createdAt: number };
const CACHE = new Map<string, CacheRecord>();

const parseEpsStr = (raw: string | null | undefined): number | null => {
  if (!raw || raw === "N/A" || raw === "") return null;
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/\(([^)]+)\)/, "-$1");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
};

const parseMarketCap = (raw: string | null | undefined): number | null => {
  if (!raw || raw === "") return null;
  const cleaned = raw.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
};

const toReportTime = (raw: string): EarningsEntry["reportTime"] => {
  if (raw === "time-pre-market") return "BMO";
  if (raw === "time-after-hours") return "AMC";
  return "TNS";
};

const toStatus = (
  epsActual: number | null,
  epsEstimate: number | null
): EarningsEntry["status"] => {
  if (epsActual == null || epsEstimate == null) return "upcoming";
  const diff = epsActual - epsEstimate;
  const pct =
    epsEstimate !== 0 ? (diff / Math.abs(epsEstimate)) * 100 : diff > 0 ? 100 : -100;
  if (pct > 1.5) return "beat";
  if (pct < -1.5) return "miss";
  return "inline";
};

const safeNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const safeStr = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  return String(v);
};

interface NasdaqRow {
  symbol: string;
  name: string;
  time: string;
  epsForecast: string;
  lastYearEPS: string;
  lastYearRptDt: string;
  fiscalQuarterEnding: string;
  marketCap: string;
  noOfEsts: string;
}

interface NasdaqResponse {
  data?: { rows?: NasdaqRow[]; asOf?: string };
}

type YahooEnrich = {
  price: number | null;
  changePercent: number | null;
  sector: string | null;
  industry: string | null;
  trailingPE: number | null;
  forwardPE: number | null;
  epsTrailingTwelveMonths: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  avgVolume: number | null;
};

const fetchYahooEnrichment = async (
  symbols: string[]
): Promise<Map<string, YahooEnrich>> => {
  const result = new Map<string, YahooEnrich>();

  // Fetch two batches of 30 so we cover more symbols
  const batches = [symbols.slice(0, 30), symbols.slice(30, 60)].filter((b) => b.length > 0);

  await Promise.allSettled(
    batches.map(async (batch) => {
      try {
        const fields = [
          "regularMarketPrice",
          "regularMarketChangePercent",
          "regularMarketVolume",
          "averageDailyVolume3Month",
          "trailingPE",
          "forwardPE",
          "epsTrailingTwelveMonths",
          "epsForward",
          "fiftyTwoWeekHigh",
          "fiftyTwoWeekLow",
          "sector",
          "industry",
        ].join(",");

        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(batch.join(","))}&fields=${fields}`;

        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            Referer: "https://finance.yahoo.com",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) return;

        const json = (await res.json()) as {
          quoteResponse?: { result?: Array<Record<string, unknown>> };
        };

        for (const q of json?.quoteResponse?.result ?? []) {
          const sym = safeStr(q.symbol);
          if (!sym) continue;

          result.set(sym, {
            price: safeNum(q.regularMarketPrice),
            changePercent: safeNum(q.regularMarketChangePercent),
            sector: safeStr(q.sector),
            industry: safeStr(q.industry),
            trailingPE: safeNum(q.trailingPE),
            forwardPE: safeNum(q.forwardPE),
            epsTrailingTwelveMonths: safeNum(q.epsTrailingTwelveMonths),
            fiftyTwoWeekHigh: safeNum(q.fiftyTwoWeekHigh),
            fiftyTwoWeekLow: safeNum(q.fiftyTwoWeekLow),
            volume: safeNum(q.regularMarketVolume),
            avgVolume: safeNum(q.averageDailyVolume3Month),
          });
        }
      } catch {
        // silent
      }
    })
  );

  return result;
};

const fetchNasdaqEarnings = async (dateStr: string): Promise<EarningsEntry[]> => {
  const url = `https://api.nasdaq.com/api/calendar/earnings?date=${dateStr}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.nasdaq.com/",
      Origin: "https://www.nasdaq.com",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Nasdaq API ${res.status}`);

  const json = (await res.json()) as NasdaqResponse;
  const rows = json?.data?.rows ?? [];
  if (!rows.length) throw new Error("Nasdaq returned no rows");

  const symbols = rows.map((r) => r.symbol).filter(Boolean);
  const enrichMap = await fetchYahooEnrichment(symbols);

  return rows.map((row) => {
    const epsEstimate = parseEpsStr(row.epsForecast);
    const lastYearEPS = parseEpsStr(row.lastYearEPS);
    const enrich = enrichMap.get(row.symbol);
    const epsActual: number | null = null; // Nasdaq calendar doesn't provide actuals yet
    const epsDiff =
      epsActual != null && epsEstimate != null ? epsActual - epsEstimate : null;
    const epsSurprisePct =
      epsDiff != null && epsEstimate != null && epsEstimate !== 0
        ? (epsDiff / Math.abs(epsEstimate)) * 100
        : null;

    return {
      id: `${row.symbol}-${dateStr}`,
      symbol: row.symbol,
      shortName: row.name,
      fiscalQuarterEnding: row.fiscalQuarterEnding,
      epsEstimate,
      epsActual,
      epsDifference: epsDiff,
      epsSurprisePct,
      lastYearEPS,
      revenueEstimate: null,
      revenueActual: null,
      revenueSurprisePct: null,
      reportTime: toReportTime(row.time),
      reportDate: dateStr,
      noOfEsts:
        row.noOfEsts && row.noOfEsts !== "N/A" ? Number(row.noOfEsts) : null,
      status: toStatus(epsActual, epsEstimate),
      marketCap: parseMarketCap(row.marketCap),
      price: enrich?.price ?? null,
      changePercent: enrich?.changePercent ?? null,
      sector: enrich?.sector ?? null,
      industry: enrich?.industry ?? null,
      trailingPE: enrich?.trailingPE ?? null,
      forwardPE: enrich?.forwardPE ?? null,
      epsTrailingTwelveMonths: enrich?.epsTrailingTwelveMonths ?? null,
      fiftyTwoWeekHigh: enrich?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: enrich?.fiftyTwoWeekLow ?? null,
      volume: enrich?.volume ?? null,
      avgVolume: enrich?.avgVolume ?? null,
    } satisfies EarningsEntry;
  });
};

export async function GET() {
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10);
  const cacheKey = `earnings-nasdaq-${dateStr}`;

  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": CDN_CACHE_CONTROL,
        "x-earnings-cache": "HIT",
        "x-earnings-date": dateStr,
      },
    });
  }

  try {
    const data = await fetchNasdaqEarnings(dateStr);

    data.sort((a, b) => {
      const timeOrder = { BMO: 0, AMC: 1, TNS: 2 };
      if ((b.marketCap ?? 0) !== (a.marketCap ?? 0)) {
        return (b.marketCap ?? 0) - (a.marketCap ?? 0);
      }
      return timeOrder[a.reportTime] - timeOrder[b.reportTime];
    });

    CACHE.set(cacheKey, { data, createdAt: Date.now() });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": CDN_CACHE_CONTROL,
        "x-earnings-cache": "MISS",
        "x-earnings-date": dateStr,
        "x-earnings-count": String(data.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("Earnings fetch error:", msg);

    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": CDN_CACHE_CONTROL, "x-earnings-cache": "STALE" },
      });
    }

    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
        "x-earnings-cache": "MISS",
        "x-earnings-error": msg,
      },
    });
  }
}
