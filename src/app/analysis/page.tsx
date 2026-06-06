"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";
import { useMarket } from "@/components/layout/MarketContext";
import { MARKET_SCREENER_TYPE, MARKET_TECHNICAL_SYMBOL, FOREX_HEATMAP_CURRENCIES } from "@/lib/tradingviewWidgets";

export default function AnalysisPage() {
  const { market } = useMarket();
  const [heatmapFailed, setHeatmapFailed] = useState(false);
  const [screenerFailed, setScreenerFailed] = useState(false);
  const [technicalFailed, setTechnicalFailed] = useState(false);

  const technicalConfig = useMemo(
    () => ({
      symbol: MARKET_TECHNICAL_SYMBOL[market],
      interval: "1h",
      displayMode: "multiple",
      showIntervalTabs: true,
      hideDateRanges: false,
    }),
    [market]
  );

  const forexHeatmapConfig = useMemo(
    () => ({
      currencies: FOREX_HEATMAP_CURRENCIES,
      backgroundColor: "transparent",
    }),
    []
  );

  const stockHeatmapConfig = useMemo(
    () => ({
      dataSource: "SPX500",
      blockSize: "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      exchanges: [],
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
    }),
    []
  );

  const screenerConfig = useMemo(
    () => ({
      market: MARKET_SCREENER_TYPE[market],
      showToolbar: true,
      defaultColumn: "overview",
      defaultScreen: "general",
      height: 560,
    }),
    [market]
  );

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Market Analysis Desk</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Live widget-based analysis with market-specific heatmaps, technical signal summaries, and original guidance for interpreting what the tools show.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          {
            title: "Start With Breadth",
            body: "Heatmaps show where participation is concentrated. Broad moves across related assets usually carry more signal than one isolated bright block.",
          },
          {
            title: "Check Location",
            body: "A strong reading is less useful if price is already extended into resistance or far from a clean invalidation level.",
          },
          {
            title: "Connect Macro Context",
            body: "Compare heatmaps with calendar events, yields, dollar strength, and session timing before forming a market view.",
          },
        ].map((item) => (
          <div key={item.title} className="ff-panel p-4">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="ff-panel p-4">
        <p className="text-sm leading-6 text-[var(--ink-muted)]">
          Use this desk to narrow attention, not to chase every green or red reading. A complete analysis routine includes
          market breadth, chart location, event risk, and written trade rationale.
        </p>
        <Link href="/learn/use-market-heatmaps-without-chasing-moves" className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)] underline">
          Read the heatmap guide
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <TradingViewPanel
            title={
              market === "forex"
                ? "Forex Heatmap"
                : market === "crypto"
                  ? "Crypto Screener"
                  : "Stock Heatmap"
            }
            bodyClassName="p-0"
          >
            <div className="h-[350px] sm:h-[520px] lg:h-[560px]">
              {!heatmapFailed ? (
                market === "forex" ? (
                  <TradingViewWidget
                    scriptName="embed-widget-forex-heat-map.js"
                    config={forexHeatmapConfig}
                    onError={() => setHeatmapFailed(true)}
                  />
                ) : market === "commodities" ? (
                  <TradingViewWidget
                    scriptName="embed-widget-stock-heatmap.js"
                    config={stockHeatmapConfig}
                    onError={() => setHeatmapFailed(true)}
                  />
                ) : (
                  <TradingViewWidget
                    scriptName="embed-widget-screener.js"
                    config={screenerConfig}
                    onError={() => setHeatmapFailed(true)}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                  Heatmap/Screener widget could not load for this market.
                </div>
              )}
            </div>
          </TradingViewPanel>

          {market !== "crypto" ? (
            <TradingViewPanel title="Market Screener" bodyClassName="p-0">
              <div className="h-[350px] sm:h-[520px] lg:h-[560px]">
                {!screenerFailed ? (
                  <TradingViewWidget
                    scriptName="embed-widget-screener.js"
                    config={screenerConfig}
                    onError={() => setScreenerFailed(true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                    Screener widget could not load.
                  </div>
                )}
              </div>
            </TradingViewPanel>
          ) : null}
        </div>

        <TradingViewPanel title="Technical Analysis" bodyClassName="p-0">
          <div className="h-[350px] sm:h-[520px] lg:h-[560px]">
            {!technicalFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-technical-analysis.js"
                config={technicalConfig}
                onError={() => setTechnicalFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                Technical Analysis widget could not load.
              </div>
            )}
          </div>
        </TradingViewPanel>
      </section>
    </div>
  );
}
