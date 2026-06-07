"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EconomicCalendar from "@/components/calendar/EconomicCalendar";
import VerifiedPerspectivePanel from "@/components/calendar/VerifiedPerspectivePanel";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";

export default function CalendarPage() {
  const [widgetFailed, setWidgetFailed] = useState(false);
  const eventsConfig = useMemo(
    () => ({
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: 620,
    }),
    []
  );

  return (
    <div className="space-y-3">
      <section className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Economic Calendar</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--ink-muted)]">
          Use the calendar to prepare for known volatility windows before they arrive. Review the event, affected currency,
          expected impact, active session, and your risk plan before interpreting the release.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/learn/read-economic-calendar-before-trading-news" className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]">
            Calendar Guide
          </Link>
          <Link href="/learn/risk-management-around-high-impact-news" className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]">
            News Risk Guide
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
        <TradingViewPanel title="Economic Calendar / Live" bodyClassName="p-0">
          <div className="h-[62vh] min-h-[320px] sm:min-h-[560px]">
            {!widgetFailed ? (
              <TradingViewWidget
                scriptName="embed-widget-events.js"
                config={eventsConfig}
                onError={() => setWidgetFailed(true)}
              />
            ) : (
              <div className="h-full p-2 sm:p-3">
                <EconomicCalendar />
              </div>
            )}
          </div>
        </TradingViewPanel>

        <VerifiedPerspectivePanel />
      </section>
    </div>
  );
}
