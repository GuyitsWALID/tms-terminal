import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

type UiTickerSymbol = "EURUSD" | "GBPUSD" | "USDJPY" | "AUDUSD" | "USDCAD" | "XAUUSD";

type LiveTicker = {
  symbol: UiTickerSymbol;
  price: string;
  change: string;
  isUp: boolean;
};

type CacheRecord = {
  data: LiveTicker[];
  source: string;
  createdAt: number;
  expiresAt: number;
};

const execFileAsync = promisify(execFile);
const TICKER_CACHE = new Map<string, CacheRecord>();
const CACHE_KEY = "live-tickers";
const SOFT_TTL_MS = 1000;

let inFlightRefresh: Promise<CacheRecord> | null = null;

const UI_SYMBOLS: UiTickerSymbol[] = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "XAUUSD"];

const SYMBOL_MAP: Record<UiTickerSymbol, string> = {
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  XAUUSD: "GC=F",
};

const parseNumberish = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").replace(/%/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const formatPrice = (symbol: UiTickerSymbol, price: number) => {
  if (symbol === "XAUUSD") return price.toFixed(2);
  if (symbol.endsWith("JPY")) return price.toFixed(3);
  return price.toFixed(5);
};

const formatChange = (percent: number) => `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;

type PythonCommand = {
  executable: string;
  prefixArgs?: string[];
};

const getPythonCandidates = (): PythonCommand[] => {
  if (process.env.PYTHON_EXECUTABLE) {
    return [{ executable: process.env.PYTHON_EXECUTABLE }];
  }

  if (process.platform === "win32") {
    return [
      { executable: "python" },
      { executable: "py", prefixArgs: ["-3"] },
    ];
  }

  return [{ executable: "python3" }, { executable: "python" }];
};

const runYFinanceQuoteScript = async () => {
  const scriptPath = process.env.YFINANCE_SCRIPT_PATH || path.join(process.cwd(), "src", "lib", "python", "yfinance_quotes.py");
  const symbols = UI_SYMBOLS.map((symbol) => SYMBOL_MAP[symbol]);

  const candidates = getPythonCandidates();
  let lastError: string | null = null;

  for (const candidate of candidates) {
    try {
      const args = [...(candidate.prefixArgs ?? []), scriptPath, JSON.stringify(symbols)];
      const { stdout } = await execFileAsync(candidate.executable, args, {
        timeout: 12000,
        maxBuffer: 1024 * 1024,
      });

      const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("yfinance returned no rows");
      }

      return parsed;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  const attempted = candidates.map((c) => c.executable).join(", ");
  throw new Error(`Unable to execute yfinance script. Tried: ${attempted}. Last error: ${lastError ?? "unknown error"}`);
};

const fetchYFinanceQuotes = async (): Promise<LiveTicker[]> => {
  const rows = await runYFinanceQuoteScript();
  const byProviderSymbol = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const providerSymbol = String(row.symbol ?? "").trim();
    if (!providerSymbol) continue;
    byProviderSymbol.set(providerSymbol, row);
  }

  const liveRows = UI_SYMBOLS.map((symbol) => {
    const providerSymbol = SYMBOL_MAP[symbol];
    const quote = byProviderSymbol.get(providerSymbol);
    if (!quote) return null;

    const price = parseNumberish(quote.price);
    const changePct = parseNumberish(quote.change_pct) ?? 0;

    if (price === null) return null;

    return {
      symbol,
      price: formatPrice(symbol, price),
      change: formatChange(changePct),
      isUp: changePct >= 0,
    } satisfies LiveTicker;
  }).filter((item): item is LiveTicker => Boolean(item));

  if (liveRows.length === 0) {
    throw new Error("yfinance normalization produced no UI rows");
  }

  return liveRows;
};

const refreshTickers = async (): Promise<CacheRecord> => {
  const rows = await fetchYFinanceQuotes();
  return {
    data: rows,
    source: "yfinance",
    createdAt: Date.now(),
    expiresAt: Date.now() + SOFT_TTL_MS,
  };
};

export async function GET() {
  const cached = TICKER_CACHE.get(CACHE_KEY);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "no-store",
        "x-ticker-cache": "HIT",
        "x-ticker-source": cached.source,
      },
    });
  }

  if (!inFlightRefresh) {
    inFlightRefresh = refreshTickers().finally(() => {
      inFlightRefresh = null;
    });
  }

  try {
    const refreshed = await inFlightRefresh;
    TICKER_CACHE.set(CACHE_KEY, refreshed);

    return NextResponse.json(refreshed.data, {
      headers: {
        "Cache-Control": "no-store",
        "x-ticker-cache": "MISS",
        "x-ticker-source": refreshed.source,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "yfinance quote refresh failed";
    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "x-ticker-cache": "MISS",
          "x-ticker-source": "none",
          "x-ticker-fallback-reason": "yfinance-failed",
        },
      }
    );
  }
}
