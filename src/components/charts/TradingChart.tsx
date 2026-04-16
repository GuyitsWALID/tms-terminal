"use client";

import React, { useEffect, useRef, useState } from "react";
import type { MarketKey } from "@/types";

interface ChartWidgetProps {
  symbol: string;
  market: MarketKey;
}

export default function TradingChart({ symbol, market }: ChartWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const getTheme = () => (root.getAttribute("data-theme") === "light" ? "light" : "dark");

    const observer = new MutationObserver(() => {
      setWidgetTheme(getTheme());
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const normalized = symbol.replace("/", "");
    const tvSymbol = normalized.includes(":") ? normalized : market === "crypto" ? `BINANCE:${normalized}` : market === "commodities" ? `TVC:${normalized}` : `FX:${normalized}`;

    container.innerHTML = "";

    const widgetHost = document.createElement("div");
    widgetHost.className = "tradingview-widget-container__widget h-full w-full";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.text = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme: widgetTheme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: ["Volume@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(widgetHost);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, widgetTheme, market]);

  return (
    <div className="h-[360px] w-full overflow-hidden rounded border border-[var(--line-strong)] bg-[var(--surface-1)] sm:h-[420px] lg:h-[520px]">
      <div ref={chartContainerRef} className="h-full w-full tradingview-widget-container" />
    </div>
  );
}



