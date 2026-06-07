"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMarket } from "@/components/layout/MarketContext";
import { getMarketDefinition } from "@/lib/market";
import { MARKET_QUOTES_GROUPS, MARKET_TECHNICAL_SYMBOL } from "@/lib/tradingviewWidgets";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";
import FinancialJuiceLivePanel from "@/components/news/FinancialJuiceLivePanel";
import EarningsReport from "@/components/calendar/EarningsReport";

function HomeContent() {
  const searchParams = useSearchParams();
  const { market } = useMarket();
  const marketConfig = getMarketDefinition(market);

  const [newsWidgetFailed, setNewsWidgetFailed] = useState(false);
  const [calendarWidgetFailed, setCalendarWidgetFailed] = useState(false);
  const [marketDataWidgetFailed, setMarketDataWidgetFailed] = useState(false);
  const [technicalWidgetFailed, setTechnicalWidgetFailed] = useState(false);
  const [selectedTechnicalSymbol, setSelectedTechnicalSymbol] = useState(MARKET_TECHNICAL_SYMBOL[market]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const next = searchParams.get("next") ?? "/profile";
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("next", next);
    window.location.replace(callbackUrl.toString());
  }, [searchParams]);

  useEffect(() => {
    setSelectedTechnicalSymbol(MARKET_TECHNICAL_SYMBOL[market]);
  }, [market]);

  const technicalSymbolOptions = useMemo(() => {
    const marketPairs = marketConfig.chartSymbols.map((pair) => ({
      label: pair.display,
      value: pair.tradingView,
    }));
    const existing = new Set(marketPairs.map((pair) => pair.value));
    const fallback =
      !existing.has(MARKET_TECHNICAL_SYMBOL[market])
        ? [{ label: MARKET_TECHNICAL_SYMBOL[market].split(":")[1] ?? "Default", value: MARKET_TECHNICAL_SYMBOL[market] }]
        : [];
    return [...marketPairs, ...fallback];
  }, [market, marketConfig.chartSymbols]);

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
      symbol: selectedTechnicalSymbol,
      interval: "1h",
      displayMode: "single",
      showIntervalTabs: true,
      hideDateRanges: false,
      width: "100%",
      height: 560,
    }),
    [selectedTechnicalSymbol]
  );

  return (
    <div className="space-y-3">
      {/* ── News + Economic Calendar ───────────────────────────── */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {!newsWidgetFailed ? (
          <TradingViewPanel title="News / Top Stories" bodyClassName="p-0">
            <div className="h-[340px] sm:h-[500px]">
              <TradingViewWidget
                scriptName="embed-widget-timeline.js"
                config={newsConfig}
                onError={() => setNewsWidgetFailed(true)}
              />
            </div>
          </TradingViewPanel>
        ) : (
          <TradingViewPanel title="News / Top Stories" bodyClassName="p-0">
            <div className="flex h-[340px] items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:h-[500px] sm:text-sm">
              News widget unavailable in this environment.
            </div>
          </TradingViewPanel>
        )}

        <TradingViewPanel title="Economic Calendar" bodyClassName="p-0">
          <div className="h-[340px] sm:h-[500px]">
            {!calendarWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-events.js"
                config={eventsConfig}
                onError={() => setCalendarWidgetFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                Economic Calendar widget unavailable in this environment.
              </div>
            )}
          </div>
        </TradingViewPanel>
      </section>

      {/* ── FinancialJuice live feed + Earnings Report ─────────── */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="xl:h-[620px]">
          <FinancialJuiceLivePanel />
        </div>
        <div className="xl:h-[620px]">
          <EarningsReport />
        </div>
      </div>

      {/* ── Market Data + Technical Analysis ──────────────────── */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TradingViewPanel title="Market Data" bodyClassName="p-0">
          <div className="h-[360px] sm:h-[500px] lg:h-[560px]">
            {!marketDataWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-market-quotes.js"
                config={marketDataConfig}
                onError={() => setMarketDataWidgetFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                Market Data widget unavailable in this environment.{" "}
                <Link href="/charts" className="ml-1 underline text-[var(--ink-primary)]">
                  Open Markets page
                </Link>{" "}
                for live charts.
              </div>
            )}
          </div>
        </TradingViewPanel>

        <TradingViewPanel
          title="Technical Analysis"
          headerRight={
            <select
              value={selectedTechnicalSymbol}
              onChange={(event) => setSelectedTechnicalSymbol(event.target.value)}
              className="h-7 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-primary)] outline-none sm:h-8 sm:text-[11px]"
              aria-label="Select technical analysis pair"
            >
              {technicalSymbolOptions.map((pair) => (
                <option key={pair.value} value={pair.value}>
                  {pair.label}
                </option>
              ))}
            </select>
          }
          bodyClassName="p-0"
        >
          <div className="h-[360px] sm:h-[500px] lg:h-[560px]">
            {!technicalWidgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-technical-analysis.js"
                config={technicalConfig}
                onError={() => setTechnicalWidgetFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--ink-muted)] sm:text-sm">
                Technical Analysis widget unavailable in this environment.{" "}
                <Link href="/charts" className="ml-1 underline text-[var(--ink-primary)]">
                  Open Markets page
                </Link>{" "}
                for live charts.
              </div>
            )}
          </div>
        </TradingViewPanel>
      </section>

      <section className="ff-panel p-5">
        <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Financial Vibe Market Desk</p>
        <h1 className="mt-2 font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)] sm:text-4xl">
          Market Tools With Educational Context
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--ink-muted)]">
          Financial Vibe helps retail traders prepare before the market moves: economic calendar timing, live chart context,
          market news awareness, educational macro guides, and community discussion in one workspace. The platform is built
          for preparation and learning, not promises of profit or personal financial advice.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Start Learning", href: "/learn" },
            { label: "Read Risk Disclaimer", href: "/disclaimer" },
            { label: "Open Calendar", href: "/calendar" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded border px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-[var(--surface-hover)] ${
                item.href === "/disclaimer"
                  ? "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-primary)] hover:border-[#ff4b55] focus-visible:border-[#ff4b55]"
                  : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-primary)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          {
            title: "Prepare With Calendar Context",
            body: "Use high-impact events to identify risk windows before you trade. Compare the event, active session, and affected instruments before making decisions.",
            href: "/learn/read-economic-calendar-before-trading-news",
          },
          {
            title: "Read Charts With Risk First",
            body: "Charts and widgets are context tools. Define levels, invalidation, and event risk before treating a price move as a trade idea.",
            href: "/learn/risk-management-around-high-impact-news",
          },
          {
            title: "Build Process Through Education",
            body: "The Learn library explains macro releases, sessions, order flow, heatmaps, gold, and journaling in plain language for developing traders.",
            href: "/learn",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="ff-panel block p-4 hover:bg-[var(--surface-hover)]">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{item.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl py-10 text-sm text-[var(--ink-muted)]">
          Loading…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
