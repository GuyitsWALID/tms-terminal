"use client";

import React, { memo, useEffect, useRef } from "react";

type TradingViewSymbolInfoCardProps = {
  symbol: string;
  title: string;
  theme: "dark" | "light";
};

function TradingViewSymbolInfoCard({ symbol, title, theme }: TradingViewSymbolInfoCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetHost = document.createElement("div");
    widgetHost.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.type = "text/javascript";
    script.async = true;
    script.text = JSON.stringify({
      symbol,
      colorTheme: theme,
      isTransparent: true,
      locale: "en",
      width: "100%",
    });

    container.appendChild(widgetHost);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, theme]);

  const symbolSlug = symbol.replace(":", "-").replace(/!/g, "");

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-copyright text-[10px] text-[var(--ink-muted)]">
        <a
          href={`https://www.tradingview.com/symbols/${symbolSlug}/`}
          rel="noopener nofollow"
          target="_blank"
          className="text-[var(--ink-primary)]"
        >
          {title}
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewSymbolInfoCard);
