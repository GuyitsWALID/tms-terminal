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
        { name: "FX:AUDUSD", displayName: "AUD/USD" },
        { name: "FX:NZDUSD", displayName: "NZD/USD" },
        { name: "FX:EURJPY", displayName: "EUR/JPY" },
        { name: "FX:GBPJPY", displayName: "GBP/JPY" },
        { name: "FX:EURGBP", displayName: "EUR/GBP" },
        { name: "TVC:GOLD", displayName: "Gold" },
        { name: "TVC:SILVER", displayName: "Silver" },
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
        { name: "BINANCE:BNBUSDT", displayName: "BNB/USDT" },
        { name: "BINANCE:AVAXUSDT", displayName: "AVAX/USDT" },
        { name: "BINANCE:LINKUSDT", displayName: "LINK/USDT" },
        { name: "BINANCE:DOTUSDT", displayName: "DOT/USDT" },
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
        { name: "TVC:VIX", displayName: "VIX" },
        { name: "NASDAQ:AAPL", displayName: "AAPL" },
        { name: "NASDAQ:MSFT", displayName: "MSFT" },
        { name: "NASDAQ:NVDA", displayName: "NVDA" },
        { name: "NASDAQ:TSLA", displayName: "TSLA" },
        { name: "NASDAQ:AMZN", displayName: "AMZN" },
        { name: "NASDAQ:META", displayName: "META" },
      ],
    },
  ],
  stocks: [
    {
      name: "US Indices + Leaders",
      symbols: [
        { name: "FOREXCOM:SPXUSD", displayName: "US 500" },
        { name: "FOREXCOM:NSXUSD", displayName: "US 100" },
        { name: "FOREXCOM:DJI", displayName: "US 30" },
        { name: "FOREXCOM:US2000", displayName: "US 2000" },
        { name: "TVC:VIX", displayName: "VIX" },
        { name: "NASDAQ:AAPL", displayName: "AAPL" },
        { name: "NASDAQ:MSFT", displayName: "MSFT" },
        { name: "NASDAQ:NVDA", displayName: "NVDA" },
        { name: "NASDAQ:TSLA", displayName: "TSLA" },
        { name: "NASDAQ:AMZN", displayName: "AMZN" },
        { name: "NASDAQ:META", displayName: "META" },
      ],
    },
  ],
};

export const MARKET_TECHNICAL_SYMBOL: Record<MarketKey, string> = {
  forex: "FX:EURUSD",
  crypto: "BINANCE:BTCUSDT",
  commodities: "FOREXCOM:SPXUSD",
  stocks: "FOREXCOM:SPXUSD",
};

export const MARKET_SCREENER_TYPE: Record<MarketKey, "forex" | "crypto" | "america"> = {
  forex: "forex",
  crypto: "crypto",
  commodities: "america",
  stocks: "america",
};

export const FOREX_HEATMAP_CURRENCIES = ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"];
