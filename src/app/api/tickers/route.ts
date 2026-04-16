import { NextResponse } from "next/server";
import { normalizeMarket } from "@/lib/market";

type UiTickerSymbol = string;

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

const TICKER_CACHE = new Map<string, CacheRecord>();
const SOFT_TTL_MS = 1000;

const IN_FLIGHT_REFRESH = new Map<string, Promise<CacheRecord>>();

const SYMBOL_MAP: Record<string, string> = {
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  XAUUSD: "GC=F",
  BTCUSD: "BTC-USD",
  ETHUSD: "ETH-USD",
  SOLUSD: "SOL-USD",
  XRPUSD: "XRP-USD",
  ADAUSD: "ADA-USD",
  DOGEUSD: "DOGE-USD",
  XAGUSD: "SI=F",
  USOIL: "CL=F",
  UKOIL: "BZ=F",
  NATGAS: "NG=F",
  CORN: "ZC=F",
  SPXUSD: "^GSPC",
  NSXUSD: "^NDX",
  DJI: "^DJI",
  US2000: "^RUT",
  AAPL: "AAPL",
  MSFT: "MSFT",
  NVDA: "NVDA",
  TSLA: "TSLA",
};

const MARKET_SYMBOLS: Record<"forex" | "crypto" | "commodities", UiTickerSymbol[]> = {
  forex: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "XAUUSD"],
  crypto: ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD", "ADAUSD", "DOGEUSD"],
  commodities: ["SPXUSD", "NSXUSD", "DJI", "US2000", "AAPL", "MSFT", "NVDA", "TSLA"],
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
  if (symbol === "XAGUSD") return price.toFixed(3);
  if (symbol === "BTCUSD") return price.toFixed(2);
  if (symbol === "ETHUSD") return price.toFixed(2);
  if (symbol === "SOLUSD") return price.toFixed(3);
  if (symbol === "XRPUSD" || symbol === "ADAUSD" || symbol === "DOGEUSD") return price.toFixed(4);
  if (symbol === "USOIL" || symbol === "UKOIL" || symbol === "NATGAS") return price.toFixed(3);
  if (symbol === "CORN") return price.toFixed(2);
  if (["SPXUSD", "NSXUSD", "DJI", "US2000"].includes(symbol)) return price.toFixed(2);
  if (["AAPL", "MSFT", "NVDA", "TSLA"].includes(symbol)) return price.toFixed(2);
  if (symbol.endsWith("JPY")) return price.toFixed(3);
  return price.toFixed(5);
};

const formatChange = (percent: number) => `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      description?: string;
    } | null;
  };
};

const fetchYahooSymbol = async (providerSymbol: string) => {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(providerSymbol)}?interval=1d&range=5d`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo chart failed for ${providerSymbol} (${response.status})`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  if (!result) {
    const apiError = payload.chart?.error?.description ?? "missing chart result";
    throw new Error(`Yahoo chart invalid for ${providerSymbol}: ${apiError}`);
  }

  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const latestClose = closes.length > 0 ? closes[closes.length - 1] : null;
  const previousCloseSeries = closes.length > 1 ? closes[closes.length - 2] : null;
  const marketPrice = parseNumberish(result.meta?.regularMarketPrice);
  const previousClose =
    parseNumberish(result.meta?.previousClose) ?? parseNumberish(result.meta?.chartPreviousClose) ?? previousCloseSeries;

  const price = marketPrice ?? latestClose;
  if (price === null) {
    throw new Error(`Yahoo chart missing price for ${providerSymbol}`);
  }

  let changePct = 0;
  if (typeof previousClose === "number" && previousClose !== 0) {
    changePct = ((price - previousClose) / previousClose) * 100;
  }

  return { price, changePct };
};

const fetchYahooQuotes = async (symbols: UiTickerSymbol[]): Promise<LiveTicker[]> => {
  const rows = await Promise.all(
    symbols.map(async (symbol) => {
      const providerSymbol = SYMBOL_MAP[symbol];
      if (!providerSymbol) {
        throw new Error(`Missing provider symbol map for ${symbol}`);
      }
      const quote = await fetchYahooSymbol(providerSymbol);

      return {
        symbol,
        price: formatPrice(symbol, quote.price),
        change: formatChange(quote.changePct),
        isUp: quote.changePct >= 0,
      } satisfies LiveTicker;
    })
  );

  if (rows.length === 0) {
    throw new Error("Yahoo normalization produced no UI rows");
  }

  return rows;
};

const refreshTickers = async (symbols: UiTickerSymbol[]): Promise<CacheRecord> => {
  const rows = await fetchYahooQuotes(symbols);
  return {
    data: rows,
    source: "yahoo-chart-http",
    createdAt: Date.now(),
    expiresAt: Date.now() + SOFT_TTL_MS,
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = normalizeMarket(url.searchParams.get("market"));
  const symbols = MARKET_SYMBOLS[market];
  const cacheKey = `live-tickers-${market}`;

  const cached = TICKER_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "no-store",
        "x-ticker-cache": "HIT",
        "x-ticker-source": cached.source,
      },
    });
  }

  let inFlightRefresh = IN_FLIGHT_REFRESH.get(cacheKey);

  if (!inFlightRefresh) {
    inFlightRefresh = refreshTickers(symbols).finally(() => {
      IN_FLIGHT_REFRESH.delete(cacheKey);
    });
    IN_FLIGHT_REFRESH.set(cacheKey, inFlightRefresh);
  }

  try {
    const refreshed = await inFlightRefresh;
    TICKER_CACHE.set(cacheKey, refreshed);

    return NextResponse.json(refreshed.data, {
      headers: {
        "Cache-Control": "no-store",
        "x-ticker-cache": "MISS",
        "x-ticker-source": refreshed.source,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Yahoo quote refresh failed";
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
          "x-ticker-fallback-reason": "yahoo-failed",
        },
      }
    );
  }
}
