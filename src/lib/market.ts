import type { MarketKey } from "@/types";

export type MarketChartSymbol = {
  display: string;
  compact: string;
  tradingView: string;
};

export type MarketDefinition = {
  id: MarketKey;
  label: string;
  description: string;
  tickerSymbols: string[];
  chartSymbols: MarketChartSymbol[];
};

const FOREX_SYMBOLS: MarketChartSymbol[] = [
  { display: "EUR/USD", compact: "EURUSD", tradingView: "FX:EURUSD" },
  { display: "GBP/USD", compact: "GBPUSD", tradingView: "FX:GBPUSD" },
  { display: "USD/JPY", compact: "USDJPY", tradingView: "FX:USDJPY" },
  { display: "USD/CHF", compact: "USDCHF", tradingView: "FX:USDCHF" },
  { display: "AUD/USD", compact: "AUDUSD", tradingView: "FX:AUDUSD" },
  { display: "NZD/USD", compact: "NZDUSD", tradingView: "FX:NZDUSD" },
  { display: "USD/CAD", compact: "USDCAD", tradingView: "FX:USDCAD" },
  { display: "XAU/USD", compact: "XAUUSD", tradingView: "TVC:GOLD" },
];

const CRYPTO_SYMBOLS: MarketChartSymbol[] = [
  { display: "BTC/USD", compact: "BTCUSD", tradingView: "BINANCE:BTCUSDT" },
  { display: "ETH/USD", compact: "ETHUSD", tradingView: "BINANCE:ETHUSDT" },
  { display: "SOL/USD", compact: "SOLUSD", tradingView: "BINANCE:SOLUSDT" },
  { display: "XRP/USD", compact: "XRPUSD", tradingView: "BINANCE:XRPUSDT" },
  { display: "ADA/USD", compact: "ADAUSD", tradingView: "BINANCE:ADAUSDT" },
  { display: "DOGE/USD", compact: "DOGEUSD", tradingView: "BINANCE:DOGEUSDT" },
];

const COMMODITY_SYMBOLS: MarketChartSymbol[] = [
  { display: "Gold", compact: "XAUUSD", tradingView: "TVC:GOLD" },
  { display: "Silver", compact: "XAGUSD", tradingView: "COMEX:SI1!" },
  { display: "WTI Oil", compact: "USOIL", tradingView: "NYMEX:CL1!" },
  { display: "Brent Oil", compact: "UKOIL", tradingView: "TVC:UKOIL" },
  { display: "Natural Gas", compact: "NATGAS", tradingView: "NYMEX:NG1!" },
  { display: "Corn", compact: "CORN", tradingView: "CBOT:ZC1!" },
];

export const MARKET_DEFINITIONS: Record<MarketKey, MarketDefinition> = {
  forex: {
    id: "forex",
    label: "Forex",
    description: "Major currency pairs and macro-driven FX context.",
    tickerSymbols: FOREX_SYMBOLS.map((symbol) => symbol.compact),
    chartSymbols: FOREX_SYMBOLS,
  },
  crypto: {
    id: "crypto",
    label: "Crypto",
    description: "Major crypto pairs with digital-asset-focused coverage.",
    tickerSymbols: CRYPTO_SYMBOLS.map((symbol) => symbol.compact),
    chartSymbols: CRYPTO_SYMBOLS,
  },
  commodities: {
    id: "commodities",
    label: "Commodities",
    description: "Metals, energy, and commodity benchmark instruments.",
    tickerSymbols: COMMODITY_SYMBOLS.map((symbol) => symbol.compact),
    chartSymbols: COMMODITY_SYMBOLS,
  },
};

export const MARKET_ORDER: MarketKey[] = ["forex", "crypto", "commodities"];

export const normalizeMarket = (value: string | null | undefined): MarketKey => {
  if (value === "crypto" || value === "commodities" || value === "forex") return value;
  return "forex";
};

export const getMarketDefinition = (market: MarketKey) => MARKET_DEFINITIONS[market];

export const getDefaultChartSymbol = (market: MarketKey): MarketChartSymbol => {
  const marketConfig = getMarketDefinition(market);
  return marketConfig.chartSymbols[0];
};

export const getChartSymbolByCompact = (market: MarketKey, compact: string): MarketChartSymbol | null => {
  const marketConfig = getMarketDefinition(market);
  const found = marketConfig.chartSymbols.find((symbol) => symbol.compact === compact);
  return found ?? null;
};

export const MARKET_KEYWORDS: Record<MarketKey, string[]> = {
  forex: ["forex", "fx", "usd", "eur", "gbp", "jpy", "boe", "ecb", "boj", "cad", "aud", "nzd", "chf"],
  crypto: ["crypto", "bitcoin", "btc", "ethereum", "eth", "sol", "xrp", "doge", "ada", "token", "blockchain", "defi"],
  commodities: ["commodities", "commodity", "gold", "silver", "oil", "wti", "brent", "crude", "natural gas", "gas", "copper", "corn", "wheat"],
};

export const MARKET_CALENDAR_CURRENCIES: Record<MarketKey, string[]> = {
  forex: ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"],
  crypto: ["USD"],
  commodities: ["USD", "CAD", "AUD", "NZD"],
};
