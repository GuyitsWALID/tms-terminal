import { NextResponse } from "next/server";
import type { EpsHistoryPoint } from "@/types/api";

const CDN_CACHE_CONTROL = "public, s-maxage=600, stale-while-revalidate=3600";

const CACHE_TTL_MS = 60 * 60 * 1000; // 60 min
type CacheRecord = { data: EpsHistoryPoint[]; createdAt: number };
const CACHE = new Map<string, CacheRecord>();

const toStatus = (
  actual: number | null,
  estimate: number | null
): EpsHistoryPoint["status"] => {
  if (actual == null || estimate == null) return "upcoming";
  const pct =
    estimate !== 0
      ? ((actual - estimate) / Math.abs(estimate)) * 100
      : actual > 0
        ? 100
        : -100;
  if (pct > 1.5) return "beat";
  if (pct < -1.5) return "miss";
  return "inline";
};

const fmtQuarter = (epochSec: number): string => {
  const d = new Date(epochSec * 1000);
  const month = d.getUTCMonth(); // 0-based
  const year = d.getUTCFullYear();
  const q = Math.floor(month / 3) + 1;
  return `Q${q}'${String(year).slice(2)}`;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase().trim();

  const cached = CACHE.get(sym);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": CDN_CACHE_CONTROL, "x-eps-cache": "HIT" },
    });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=earningsHistory`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Yahoo ${res.status}`);

    const json = (await res.json()) as {
      quoteSummary?: {
        result?: Array<{
          earningsHistory?: {
            history?: Array<{
              quarter?: { raw: number };
              epsActual?: { raw: number };
              epsEstimate?: { raw: number };
              surprisePercent?: { raw: number };
            }>;
          };
        }>;
        error?: { code: string; description: string };
      };
    };

    const err = json?.quoteSummary?.error;
    if (err) throw new Error(`${err.code}: ${err.description}`);

    const history =
      json?.quoteSummary?.result?.[0]?.earningsHistory?.history ?? [];

    const points: EpsHistoryPoint[] = history
      .slice(-4) // last 4 quarters only
      .map((h) => {
        const epsActual = h.epsActual?.raw ?? null;
        const epsEstimate = h.epsEstimate?.raw ?? null;
        const surprisePct = h.surprisePercent?.raw ?? null;
        return {
          quarter: h.quarter?.raw ? fmtQuarter(h.quarter.raw) : "?",
          epsActual,
          epsEstimate,
          surprisePct,
          status: toStatus(epsActual, epsEstimate),
        };
      });

    CACHE.set(sym, { data: points, createdAt: Date.now() });

    return NextResponse.json(points, {
      headers: {
        "Cache-Control": CDN_CACHE_CONTROL,
        "x-eps-cache": "MISS",
        "x-eps-count": String(points.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": CDN_CACHE_CONTROL, "x-eps-cache": "STALE" },
      });
    }
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120", "x-eps-error": msg },
    });
  }
}
