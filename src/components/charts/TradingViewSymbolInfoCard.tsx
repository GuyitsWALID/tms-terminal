"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

type TradingViewSymbolInfoCardProps = {
  symbol: string;
  title: string;
  theme: "dark" | "light";
};

function SymbolFallbackCard({ symbol, title }: { symbol: string; title: string }) {
  const slug = symbol.replace(":", "-").replace(/!/g, "");
  const displayName = symbol.includes(":") ? symbol.split(":")[1] : symbol;

  return (
    <a
      href={`https://www.tradingview.com/symbols/${slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-[80px] w-full items-center justify-between rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 transition-colors hover:bg-[var(--surface-hover)] group"
    >
      <div>
        <p className="text-sm font-bold text-[var(--ink-primary)]">{displayName}</p>
        <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">{title}</p>
        <p className="mt-1 text-[10px] text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)]">
          View live chart →
        </p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)]" />
    </a>
  );
}

function TradingViewSymbolInfoCard({ symbol, title, theme }: TradingViewSymbolInfoCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

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

    script.onerror = () => setFailed(true);

    container.appendChild(widgetHost);
    container.appendChild(script);

    // If no iframe appears after a short grace period, show fallback.
    const t = setTimeout(() => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      if (!iframe || iframe.clientHeight < 20) {
        setFailed(true);
      }
    }, 6000);

    return () => {
      clearTimeout(t);
      container.innerHTML = "";
    };
  }, [symbol, theme, failed]);

  if (failed) {
    return <SymbolFallbackCard symbol={symbol} title={title} />;
  }

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
