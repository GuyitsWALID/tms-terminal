import type { EpsHistoryPoint } from "@/types/api";

export const EPS_CDN_CACHE_CONTROL = "public, s-maxage=600, stale-while-revalidate=3600";
const EPS_CACHE_TTL_MS = 60 * 60 * 1000;

type CacheRecord = { data: EpsHistoryPoint[]; createdAt: number };

const EPS_CACHE = new Map<string, CacheRecord>();

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
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  const q = Math.floor(month / 3) + 1;
  return `Q${q}'${String(year).slice(2)}`;
};

const fetchFromYahoo = async (symbol: string): Promise<EpsHistoryPoint[]> => {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=earningsHistory`;
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

  const history = json?.quoteSummary?.result?.[0]?.earningsHistory?.history ?? [];

  return history.slice(-4).map((h) => {
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
};

export const getEpsHistory = async (symbol: string) => {
  const sym = symbol.toUpperCase().trim();
  const cached = EPS_CACHE.get(sym);
  if (cached && Date.now() - cached.createdAt < EPS_CACHE_TTL_MS) {
    return { symbol: sym, data: cached.data, cache: "HIT" as const };
  }

  try {
    const data = await fetchFromYahoo(sym);
    EPS_CACHE.set(sym, { data, createdAt: Date.now() });
    return { symbol: sym, data, cache: "MISS" as const };
  } catch (error) {
    if (cached) {
      return { symbol: sym, data: cached.data, cache: "STALE" as const };
    }
    const message = error instanceof Error ? error.message : "unknown";
    return { symbol: sym, data: [] as EpsHistoryPoint[], cache: "ERROR" as const, error: message };
  }
};

export const parseSymbolsFromRequest = (url: URL) => {
  const fromRepeated = url.searchParams
    .getAll("symbol")
    .flatMap((entry) => entry.split(","))
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  return Array.from(new Set(fromRepeated)).slice(0, 80);
};
