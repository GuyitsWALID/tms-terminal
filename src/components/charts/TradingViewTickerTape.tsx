"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMarket } from "@/components/layout/MarketContext";
import { cn } from "@/lib/utils";

const SCRIPT_ID = "tradingview-webcomponent-ticker-script";
const SCRIPT_SRC = "https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js";

const SYMBOLS_BY_MARKET = {
  forex: [
    "FX:EURUSD",
    "FX:GBPUSD",
    "FX:USDJPY",
    "FX:USDCHF",
    "OANDA:AUDUSD",
    "FX:USDCAD",
    "FOREXCOM:XAUUSD",
    "FOREXCOM:XAGUSD",
  ],
  crypto: [
    "BITSTAMP:BTCUSD",
    "BITSTAMP:ETHUSD",
    "BITSTAMP:LTCUSD",
    "BITSTAMP:XRPUSD",
    "COINBASE:SOLUSD",
    "COINBASE:ADAUSD",
    "COINBASE:DOGEUSD",
    "COINBASE:AVAXUSD",
  ],
  commodities: [
    "FOREXCOM:SPXUSD",
    "FOREXCOM:NSXUSD",
    "FOREXCOM:DJI",
    "FOREXCOM:US2000",
    "NASDAQ:AAPL",
    "NASDAQ:MSFT",
    "NASDAQ:NVDA",
    "NASDAQ:TSLA",
  ],
} as const;

type TradingViewTickerTapeProps = {
  className?: string;
};

const MARKET_TICKER_THEME = {
  forex: {
    dark: { bg: "#0a0f18", border: "#273348", tint: "rgba(52, 108, 196, 0.08)", buttonBg: "#101726", buttonText: "#e7eefb", buttonBorder: "#3d4f71" },
    light: { bg: "#eef3fb", border: "#c8d6ea", tint: "rgba(93, 139, 215, 0.08)", buttonBg: "#f8fbff", buttonText: "#1e2f4b", buttonBorder: "#b7cbe8" },
  },
  crypto: {
    dark: { bg: "#1a0f2a", border: "#5b3a88", tint: "rgba(143, 94, 220, 0.16)", buttonBg: "#28193c", buttonText: "#efe3ff", buttonBorder: "#8157ba" },
    light: { bg: "#f3e8ff", border: "#c6a9ec", tint: "rgba(168, 119, 245, 0.16)", buttonBg: "#f8f0ff", buttonText: "#5a358c", buttonBorder: "#d8bdf7" },
  },
  commodities: {
    dark: { bg: "#0f2418", border: "#3f7e5e", tint: "rgba(70, 161, 106, 0.16)", buttonBg: "#173524", buttonText: "#e6f8ec", buttonBorder: "#5fa37d" },
    light: { bg: "#e8f7ec", border: "#a7cfb4", tint: "rgba(114, 186, 138, 0.15)", buttonBg: "#f3fbf5", buttonText: "#24543b", buttonBorder: "#b9dec4" },
  },
} as const;

export default function TradingViewTickerTape({ className }: TradingViewTickerTapeProps) {
  const { market } = useMarket();
  const [, setScriptReady] = useState(false);
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("tms-theme");
    if (stored === "dark" || stored === "light") return stored;
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  const tickerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.type = "module";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setScriptReady(false);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setWidgetTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonText = typeof event.reason === "string" ? event.reason : String(event.reason ?? "");
      if (reasonText.toLowerCase().includes("[tv] permission denied")) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const symbols = useMemo(() => SYMBOLS_BY_MARKET[market], [market]);
  const tickerPalette = useMemo(() => {
    return MARKET_TICKER_THEME[market][widgetTheme];
  }, [market, widgetTheme]);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    // Force attribute sync for browsers where custom element updates are lazy.
    ticker.setAttribute("symbols", symbols.join(","));
    ticker.setAttribute("display-mode", "adaptive");
    ticker.setAttribute("locale", "en");
    ticker.setAttribute("color-theme", widgetTheme);
    ticker.setAttribute("theme", widgetTheme);
    ticker.setAttribute("is-transparent", "");
    ticker.setAttribute("show-hover", "");
  }, [symbols, widgetTheme]);

  useEffect(() => {
    const applySeeMoreButtonStyles = () => {
      const controls = Array.from(document.querySelectorAll("button, a"));
      controls.forEach((control) => {
        const text = (control.textContent ?? "").trim().toLowerCase();
        if (text !== "see more") return;

        const element = control as HTMLElement;
        element.style.backgroundColor = tickerPalette.buttonBg;
        element.style.color = tickerPalette.buttonText;
        element.style.border = `1px solid ${tickerPalette.buttonBorder}`;
      });
    };

    applySeeMoreButtonStyles();

    const observer = new MutationObserver(() => {
      applySeeMoreButtonStyles();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [tickerPalette]);

  return (
    <div
      className={cn(
        className,
        "relative overflow-hidden border transition-colors duration-200"
      )}
      style={{
        backgroundColor: tickerPalette.bg,
        borderColor: tickerPalette.border,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundColor: tickerPalette.tint,
        }}
      />
      {React.createElement("tv-ticker-tape", {
        key: `${market}-${widgetTheme}`,
        ref: tickerRef,
        symbols: symbols.join(","),
        "display-mode": "adaptive",
        locale: "en",
        "color-theme": widgetTheme,
        theme: widgetTheme,
        "is-transparent": "",
        "show-hover": "",
      })}
    </div>
  );
}
