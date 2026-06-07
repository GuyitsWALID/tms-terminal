"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FinancialJuiceLivePanel from "@/components/news/FinancialJuiceLivePanel";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";

export default function NewsPage() {
  const [widgetFailed, setWidgetFailed] = useState(false);
  const newsConfig = useMemo(
    () => ({
      displayMode: "regular",
      feedMode: "all_symbols",
      width: "100%",
      height: 620,
    }),
    []
  );

  return (
    <div className="space-y-3">
      <section className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Market News Desk</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--ink-muted)]">
          This page combines live headline monitoring with Financial Vibe editorial guidance. Headlines are starting points,
          not trade signals: verify source details, compare the news with the active market theme, and check the calendar before
          reacting to fast-moving information.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          {[
            { title: "Check the catalyst", body: "Ask whether the headline changes rates, growth, inflation, risk sentiment, or only a single asset." },
            { title: "Watch the clock", body: "A headline near a major release or session open can create different volatility than quiet-hour news." },
            { title: "Confirm on the chart", body: "Use price structure and liquidity levels before treating a headline reaction as a durable move." },
          ].map((item) => (
            <div key={item.title} className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-3">
              <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">{item.title}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
        <Link href="/learn/cpi-nfp-central-bank-rates-currency-traders" className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)] underline">
          Learn how macro headlines move currencies
        </Link>
      </section>

      {!widgetFailed ? (
        <TradingViewPanel title="Top Stories / Live" bodyClassName="p-0">
          <div className="h-[62vh] min-h-[320px] sm:min-h-[560px]">
            <TradingViewWidget
              scriptName="embed-widget-timeline.js"
              config={newsConfig}
              onError={() => setWidgetFailed(true)}
            />
          </div>
        </TradingViewPanel>
      ) : null}

      <FinancialJuiceLivePanel />

      <section className="ff-panel p-4">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Source and Use Note</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Live feeds and third-party widgets may include delayed, summarized, or externally sourced information. Financial Vibe
          adds educational context, but users should confirm important market-moving details with official releases or primary
          news sources before making decisions.
        </p>
      </section>
    </div>
  );
}
