import type { MarketKey } from "@/types";

type SymbolEntry = {
  name: string;
  displayName: string;
};

type SymbolsGroup = {
  name: string;
  symbols: SymbolEntry[];
};

export const MARKET_QUOTES_GROUPS: Record<MarketKey, SymbolsGroup[]> = {
  forex: [
    {
      name: "Majors",
      symbols: [
        { name: "FX:EURUSD", displayName: "EUR/USD" },
        { name: "FX:GBPUSD", displayName: "GBP/USD" },
        { name: "FX:USDJPY", displayName: "USD/JPY" },
        { name: "FX:USDCHF", displayName: "USD/CHF" },
        { name: "FX:USDCAD", displayName: "USD/CAD" },
        { name: "TVC:GOLD", displayName: "Gold" },
      ],
    },
  ],
  crypto: [
    {
      name: "Crypto",
      symbols: [
        { name: "BINANCE:BTCUSDT", displayName: "BTC/USDT" },
        { name: "BINANCE:ETHUSDT", displayName: "ETH/USDT" },
        { name: "BINANCE:SOLUSDT", displayName: "SOL/USDT" },
        { name: "BINANCE:XRPUSDT", displayName: "XRP/USDT" },
        { name: "BINANCE:ADAUSDT", displayName: "ADA/USDT" },
        { name: "BINANCE:DOGEUSDT", displayName: "DOGE/USDT" },
      ],
    },
  ],
  commodities: [
    {
      name: "US Indices + Leaders",
      symbols: [
        { name: "FOREXCOM:SPXUSD", displayName: "US 500" },
        { name: "FOREXCOM:NSXUSD", displayName: "US 100" },
        { name: "FOREXCOM:DJI", displayName: "US 30" },
        { name: "FOREXCOM:US2000", displayName: "US 2000" },
        { name: "NASDAQ:AAPL", displayName: "AAPL" },
        { name: "NASDAQ:MSFT", displayName: "MSFT" },
        { name: "NASDAQ:NVDA", displayName: "NVDA" },
        { name: "NASDAQ:TSLA", displayName: "TSLA" },
      ],
    },
  ],
};

export const MARKET_TECHNICAL_SYMBOL: Record<MarketKey, string> = {
  forex: "FX:EURUSD",
  crypto: "BINANCE:BTCUSDT",
  commodities: "FOREXCOM:SPXUSD",
};

export const MARKET_SCREENER_TYPE: Record<MarketKey, "forex" | "crypto" | "america"> = {
  forex: "forex",
  crypto: "crypto",
  commodities: "america",
};

export const FOREX_HEATMAP_CURRENCIES = ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"];
