"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMarket } from "@/components/layout/MarketContext";
import { getMarketDefinition } from "@/lib/market";
import { MARKET_QUOTES_GROUPS, MARKET_TECHNICAL_SYMBOL } from "@/lib/tradingviewWidgets";
import TradingViewSymbolInfoCard from "@/components/charts/TradingViewSymbolInfoCard";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";
import NewsFeed from "@/components/news/NewsFeed";
import EconomicCalendar from "@/components/calendar/EconomicCalendar";

export default function Home() {
  const { market } = useMarket();
  const marketConfig = getMarketDefinition(market);
  const [newsWidgetFailed, setNewsWidgetFailed] = useState(false);
  const [calendarWidgetFailed, setCalendarWidgetFailed] = useState(false);
  const [marketDataWidgetFailed, setMarketDataWidgetFailed] = useState(false);
  const [technicalWidgetFailed, setTechnicalWidgetFailed] = useState(false);
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setWidgetTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const marketDataConfig = useMemo(
    () => ({
      largeChartUrl: "",
      showSymbolLogo: true,
      symbolsGroups: MARKET_QUOTES_GROUPS[market],
      width: "100%",
      height: 560,
    }),
    [market]
  );

  const newsConfig = useMemo(
    () => ({
      displayMode: "regular",
      feedMode: "all_symbols",
      width: "100%",
      height: 500,
    }),
    []
  );

  const eventsConfig = useMemo(
    () => ({
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: 500,
    }),
    []
  );

  const technicalConfig = useMemo(
    () => ({
      symbol: MARKET_TECHNICAL_SYMBOL[market],
      interval: "1h",
      displayMode: "single",
      showIntervalTabs: true,
      hideDateRanges: false,
      width: "100%",
      height: 560,
    }),
    [market]
  );

  return (
    <div className="space-y-3">
      <section className="ff-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
          <h1 className="ff-panel-title text-xs sm:text-sm text-[var(--ink-primary)]">{marketConfig.label} Majors</h1>
          <Link href="/charts" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-primary)]">
            Open Market View
          </Link>
        </div>
        <div className="ff-scroll overflow-x-auto bg-[var(--surface-2)] p-3">
          <div className="flex min-w-max gap-3">
            {marketConfig.chartSymbols.map((pair) => (
              <div key={pair.compact} className="w-[300px] shrink-0 rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-2 sm:w-[340px]">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">{pair.display}</p>
                <TradingViewSymbolInfoCard symbol={pair.tradingView} title={`${pair.display} performance`} theme={widgetTheme} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <TradingViewPanel title="News / Top Stories" bodyClassName="p-0">
          <div className="h-[420px] sm:h-[500px]">
            {!newsWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-timeline.js"
                config={newsConfig}
                onError={() => setNewsWidgetFailed(true)}
              />
            ) : (
              <div className="h-full overflow-y-auto p-2 sm:p-3">
                <NewsFeed />
              </div>
            )}
          </div>
        </TradingViewPanel>

        <TradingViewPanel title="Economic Calendar" bodyClassName="p-0">
          <div className="h-[420px] sm:h-[500px]">
            {!calendarWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-events.js"
                config={eventsConfig}
                onError={() => setCalendarWidgetFailed(true)}
              />
            ) : (
              <div className="h-full overflow-y-auto p-2 sm:p-3">
                <EconomicCalendar />
              </div>
            )}
          </div>
        </TradingViewPanel>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TradingViewPanel title="Market Data" bodyClassName="p-0">
          <div className="h-[420px] sm:h-[500px] lg:h-[560px]">
            {!marketDataWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-market-quotes.js"
                config={marketDataConfig}
                onError={() => setMarketDataWidgetFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                Market Data widget could not load in this environment. Use the Markets page for chart + live selector fallback.
              </div>
            )}
          </div>
        </TradingViewPanel>

        <TradingViewPanel title="Technical Analysis" bodyClassName="p-0">
          <div className="h-[420px] sm:h-[500px] lg:h-[560px]">
            {!technicalWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-technical-analysis.js"
                config={technicalConfig}
                onError={() => setTechnicalWidgetFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                Technical Analysis widget could not load. Live chart remains available in Markets.
              </div>
            )}
          </div>
        </TradingViewPanel>
      </section>
    </div>
  );
}
