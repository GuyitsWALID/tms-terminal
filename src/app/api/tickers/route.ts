import { NextResponse } from "next/server";
import { tickerTape } from "@/lib/terminalData";

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

const TICKER_CACHE = new Map<string, CacheRecord>();
const CACHE_KEY = "live-tickers";
const SOFT_TTL_MS = 10_000;
const HARD_TTL_MS = 60_000;

let inFlightRefresh: Promise<CacheRecord> | null = null;
let primaryCooldownUntil = 0;
let fallbackCooldownUntil = 0;

const SYMBOL_MAP: Record<UiTickerSymbol, string> = {
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  XAUUSD: "GC=F",
};

const UI_SYMBOLS = Object.keys(SYMBOL_MAP) as UiTickerSymbol[];

const LOCAL_FALLBACK: LiveTicker[] = tickerTape
  .map((item) => {
    const symbol = item.symbol as UiTickerSymbol;
    if (!UI_SYMBOLS.includes(symbol)) return null;
    return {
      symbol,
      price: item.price,
      change: item.change,
      isUp: item.isUp,
    } satisfies LiveTicker;
  })
  .filter((item): item is LiveTicker => Boolean(item));

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

const parseSignedPercent = (value: string) => {
  const parsed = parseNumberish(value);
  return parsed ?? 0;
};

const getPreviousTickerBySymbol = () => {
  const cached = TICKER_CACHE.get(CACHE_KEY);
  if (!cached?.data?.length) {
    return new Map<UiTickerSymbol, { price: number; changePct: number }>();
  }

  return new Map(
    cached.data
      .map((row) => {
        const price = parseNumberish(row.price);
        if (price === null) return null;
        return [row.symbol, { price, changePct: parseSignedPercent(row.change) }] as const;
      })
      .filter((item): item is readonly [UiTickerSymbol, { price: number; changePct: number }] => Boolean(item))
  );
};

const getLocalFallbackBySymbol = () =>
  new Map(
    LOCAL_FALLBACK.map((row) => [
      row.symbol,
      {
        price: parseNumberish(row.price) ?? 0,
        changePct: parseSignedPercent(row.change),
      },
    ])
  );

const normalizeYahooPayload = (payload: unknown): Map<string, { price: number; changePct: number }> => {
  const result = new Map<string, { price: number; changePct: number }>();

  const asArray = (() => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.body)) return obj.body;
      if (Array.isArray(obj.result)) return obj.result;
      if (obj.quoteResponse && typeof obj.quoteResponse === "object") {
        const quoteResponse = obj.quoteResponse as Record<string, unknown>;
        if (Array.isArray(quoteResponse.result)) return quoteResponse.result;
      }
      if (obj.data && Array.isArray(obj.data)) return obj.data;
    }
    return [] as unknown[];
  })();

  for (const row of asArray) {
    if (!row || typeof row !== "object") continue;
    const quote = row as Record<string, unknown>;
    const providerSymbol = String(quote.symbol ?? "").trim();
    if (!providerSymbol) continue;

    const price =
      parseNumberish(quote.regularMarketPrice) ??
      parseNumberish(quote.lastPrice) ??
      parseNumberish(quote.price) ??
      parseNumberish(quote.close);

    const changePct =
      parseNumberish(quote.regularMarketChangePercent) ??
      parseNumberish(quote.changePercent) ??
      parseNumberish(quote.percentChange) ??
      (() => {
        const change = parseNumberish(quote.regularMarketChange) ?? parseNumberish(quote.change);
        const prevClose = parseNumberish(quote.regularMarketPreviousClose) ?? parseNumberish(quote.previousClose);
        if (change !== null && prevClose && prevClose !== 0) {
          return (change / prevClose) * 100;
        }
        return 0;
      })();

    if (price === null) continue;
    result.set(providerSymbol, { price, changePct });
  }

  return result;
};

const fetchRapidYahooQuotes = async (): Promise<LiveTicker[]> => {
  if (Date.now() < primaryCooldownUntil) {
    throw new Error("Primary provider cooldown active");
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error("Missing RAPIDAPI_KEY");

  const host = process.env.RAPIDAPI_YAHOO_RT_HOST ?? "yahoo-finance-real-time1.p.rapidapi.com";
  const endpoint = process.env.RAPIDAPI_YAHOO_RT_QUOTES_ENDPOINT ?? "/market/get-quotes";
  const symbols = UI_SYMBOLS.map((symbol) => SYMBOL_MAP[symbol]).join(",");
  const url = `https://${host}${endpoint}?symbols=${encodeURIComponent(symbols)}&region=US`;

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-host": host,
      "x-rapidapi-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 403) primaryCooldownUntil = Date.now() + 5 * 60_000;
    if (response.status === 429) primaryCooldownUntil = Date.now() + 60_000;
    throw new Error(`RapidAPI quotes failed (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  const normalized = normalizeYahooPayload(payload);

  const rows = UI_SYMBOLS.map((symbol) => {
    const providerSymbol = SYMBOL_MAP[symbol];
    const quote = normalized.get(providerSymbol);
    if (!quote) return null;

    return {
      symbol,
      price: formatPrice(symbol, quote.price),
      change: formatChange(quote.changePct),
      isUp: quote.changePct >= 0,
    } satisfies LiveTicker;
  }).filter((item): item is LiveTicker => Boolean(item));

  if (rows.length === 0) throw new Error("RapidAPI normalized no quote rows");
  return rows;
};

const fetchAlphaVantageQuotes = async (): Promise<LiveTicker[]> => {
  if (Date.now() < fallbackCooldownUntil) {
    throw new Error("Fallback provider cooldown active");
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY ?? "DEMO";
  const previousBySymbol = getPreviousTickerBySymbol();
  const localBySymbol = getLocalFallbackBySymbol();

  const rows: Array<LiveTicker | null> = await Promise.all(
    UI_SYMBOLS.map(async (symbol) => {
      const from = symbol.slice(0, 3);
      const to = symbol.slice(3);
      const fxPair = symbol === "XAUUSD" ? { from: "XAU", to: "USD" } : { from, to };

      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fxPair.from}&to_currency=${fxPair.to}&apikey=${apiKey}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        if (response.status === 429) fallbackCooldownUntil = Date.now() + 60_000;
        return null;
      }

      const payload = (await response.json()) as Record<string, unknown>;
      if (typeof payload.Note === "string" || typeof payload.Information === "string") {
        fallbackCooldownUntil = Date.now() + 60_000;
        return null;
      }
      const realtime = payload["Realtime Currency Exchange Rate"] as Record<string, unknown> | undefined;
      const price = parseNumberish(realtime?.["5. Exchange Rate"]);

      if (price === null) return null;

      const previous = previousBySymbol.get(symbol) ?? localBySymbol.get(symbol);
      const changePct = previous && previous.price > 0 ? ((price - previous.price) / previous.price) * 100 : previous?.changePct ?? 0;

      const row: LiveTicker = {
        symbol,
        price: formatPrice(symbol, price),
        change: formatChange(changePct),
        isUp: changePct >= 0,
      };

      return row;
    })
  );

  const resolved = rows.filter((item): item is LiveTicker => Boolean(item));
  if (resolved.length === 0) throw new Error("Alpha Vantage returned no quote rows");
  return resolved;
};

const getFallbackFromCache = () => {
  const cached = TICKER_CACHE.get(CACHE_KEY);
  if (cached && cached.createdAt + HARD_TTL_MS > Date.now()) return cached;
  return null;
};

const refreshTickers = async (): Promise<CacheRecord> => {
  try {
    const primaryRows = await fetchRapidYahooQuotes();
    return {
      data: primaryRows,
      source: "rapidapi-yahoo-real-time1",
      createdAt: Date.now(),
      expiresAt: Date.now() + SOFT_TTL_MS,
    };
  } catch (primaryError: unknown) {
    const primaryMessage = primaryError instanceof Error ? primaryError.message : "primary failed";
    console.error("Ticker primary warning:", primaryMessage);

    try {
      const fallbackRows = await fetchAlphaVantageQuotes();
      return {
        data: fallbackRows,
        source: "alpha-vantage",
        createdAt: Date.now(),
        expiresAt: Date.now() + SOFT_TTL_MS,
      };
    } catch (fallbackError: unknown) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "fallback failed";
      console.error("Ticker fallback warning:", fallbackMessage);

      const stale = getFallbackFromCache();
      if (stale) {
        return {
          ...stale,
          source: `${stale.source}:stale-cache`,
        };
      }

      return {
        data: LOCAL_FALLBACK,
        source: "local-fallback",
        createdAt: Date.now(),
        expiresAt: Date.now() + SOFT_TTL_MS,
      };
    }
  }
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

  const refreshed = await inFlightRefresh;
  TICKER_CACHE.set(CACHE_KEY, refreshed);

  const fallbackReason = refreshed.source.includes("stale-cache")
    ? "stale-cache"
    : refreshed.source === "local-fallback"
      ? "all-sources-failed"
      : refreshed.source === "alpha-vantage"
        ? "rapidapi-failed"
        : "";

  return NextResponse.json(refreshed.data, {
    headers: {
      "Cache-Control": "no-store",
      "x-ticker-cache": fallbackReason ? "STALE" : "MISS",
      "x-ticker-source": refreshed.source,
      ...(fallbackReason ? { "x-ticker-fallback-reason": fallbackReason } : {}),
    },
  });
}
