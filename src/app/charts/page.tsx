"use client";

import React, { useMemo, useState } from "react";
import { useMarket } from "@/components/layout/MarketContext";
import TickerTape from "@/components/charts/TickerTape";
import TradingChart from "@/components/charts/TradingChart";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";
import { getDefaultChartSymbol, getMarketDefinition } from "@/lib/market";
import { MARKET_QUOTES_GROUPS, MARKET_SCREENER_TYPE } from "@/lib/tradingviewWidgets";

export default function ChartsPage() {
  const { market } = useMarket();
  const marketConfig = getMarketDefinition(market);
  const [activeSymbol, setActiveSymbol] = useState(getDefaultChartSymbol(market).display);
  const [screenerFailed, setScreenerFailed] = useState(false);
  const [technicalFailed, setTechnicalFailed] = useState(false);
  const [marketDataFailed, setMarketDataFailed] = useState(false);

  const activeSymbolConfig = useMemo(() => {
    return marketConfig.chartSymbols.find((symbol) => symbol.display === activeSymbol) ?? marketConfig.chartSymbols[0];
  }, [activeSymbol, marketConfig]);

  React.useEffect(() => {
    setActiveSymbol(getDefaultChartSymbol(market).display);
  }, [market]);

  const technicalConfig = useMemo(
    () => ({
      symbol: activeSymbolConfig.tradingView,
      interval: "1h",
      displayMode: "single",
      showIntervalTabs: true,
      hideDateRanges: false,
    }),
    [activeSymbolConfig]
  );

  const marketDataConfig = useMemo(
    () => ({
      largeChartUrl: "",
      showSymbolLogo: true,
      symbolsGroups: MARKET_QUOTES_GROUPS[market],
      support_host: "https://www.tradingview.com",
    }),
    [market]
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
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">{marketConfig.label} Market</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Live TradingView charting, signals, and market data optimized for desktop and mobile.</p>
      </div>

      <TickerTape />

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <div className="ff-panel overflow-hidden">
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2">
              <h2 className="ff-panel-title text-xs sm:text-sm text-[var(--ink-primary)]">Advanced Chart</h2>
            </div>
            <div className="bg-[var(--surface-2)] p-2 sm:p-3">
              <TradingChart symbol={activeSymbolConfig.tradingView} market={market} />
            </div>
          </div>

          <TradingViewPanel title="Market Screener" bodyClassName="p-0">
            <div className="h-[420px] sm:h-[520px] lg:h-[560px]">
              {!screenerFailed ? (
                <TradingViewWidget
                  scriptName="embed-widget-screener.js"
                  config={screenerConfig}
                  onError={() => setScreenerFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                  Screener widget could not load. Continue with live chart and symbol selector.
                </div>
              )}
            </div>
          </TradingViewPanel>
        </div>

        <aside className="space-y-3">
          <div className="ff-panel overflow-hidden">
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2 text-xs font-bold uppercase text-[var(--ink-primary)]">
              Symbol Selector
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {marketConfig.chartSymbols.map((pair) => (
                <button
                  key={pair.compact}
                  onClick={() => setActiveSymbol(pair.display)}
                  className={`rounded border px-2 py-2 text-xs font-semibold ${
                    activeSymbol === pair.display
                      ? "border-[var(--brand)] bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                      : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                  }`}
                >
                  {pair.display}
                </button>
              ))}
            </div>
          </div>

          <TradingViewPanel title={`Technical Analysis / ${activeSymbol}`} bodyClassName="p-0">
            <div className="h-[380px] sm:h-[440px]">
              {!technicalFailed ? (
                <TradingViewWidget
                  scriptName="embed-widget-technical-analysis.js"
                  config={technicalConfig}
                  onError={() => setTechnicalFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                  Technical Analysis widget could not load for this symbol.
                </div>
              )}
            </div>
          </TradingViewPanel>

          <TradingViewPanel title="Market Data" bodyClassName="p-0">
            <div className="h-[420px] sm:h-[500px]">
              {!marketDataFailed ? (
                <TradingViewWidget
                  scriptName="embed-widget-market-quotes.js"
                  config={marketDataConfig}
                  onError={() => setMarketDataFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                  Market Data widget could not load for this market.
                </div>
              )}
            </div>
          </TradingViewPanel>
        </aside>
      </section>
    </div>
  );
}
