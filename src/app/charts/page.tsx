"use client";

import React, { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import TickerTape from "@/components/charts/TickerTape";
import TradingChart from "@/components/charts/TradingChart";
import { calendarEvents, featuredNews } from "@/lib/terminalData";

export default function ChartsPage() {
  const [activeSymbol, setActiveSymbol] = useState("EUR/USD");

  const compactSymbol = activeSymbol.replace("/", "");
  const topStories = featuredNews.slice(0, 6);
  const upcoming = calendarEvents.slice(0, 7);

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none">Market</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Forex market view with TradingView chart, price performance, and event context.</p>
      </div>

      <TickerTape />

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="ff-panel overflow-hidden">
          <div className="grid gap-0 border-b border-[var(--line-strong)] md:grid-cols-[minmax(0,1fr)_440px]">
            <div className="bg-[var(--surface-2)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                <span className="font-bold uppercase">Pair</span>
                <ChevronDown size={12} />
              </div>
              <div className="flex items-end gap-4">
                <h2 className="font-rajdhani text-5xl font-bold leading-none text-[var(--ink-primary)]">{activeSymbol}</h2>
                <span className="font-mono text-4xl leading-none text-[var(--ink-primary)]">1.17225</span>
              </div>
              <p className="mt-2 text-xs text-[var(--ink-muted)]">As of 12:00am Apr 11 | Spread 0.8 | Session: London/NY overlap</p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[var(--line-soft)] bg-[var(--surface-1)] text-xs">
              {[
                { label: "Last 1 hr", pip: "+2", chg: "+0.02%" },
                { label: "Last 6 hr", pip: "-6", chg: "-0.04%" },
                { label: "Last 12 hr", pip: "+14", chg: "+0.11%" },
              ].map((p) => (
                <div key={p.label} className="p-3">
                  <p className="font-semibold uppercase text-[var(--ink-muted)]">{p.label}</p>
                  <p className="mt-2 text-[var(--ink-muted)]">Pip Chg: <span className="text-[var(--ink-primary)]">{p.pip}</span></p>
                  <p className="text-[var(--ink-muted)]">% Chg: <span className="text-[var(--ink-primary)]">{p.chg}</span></p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-[var(--ink-primary)]">Chart For {activeSymbol}</span>
              <div className="flex gap-1">
                {["1m", "5m", "15m", "1H", "4H", "D"].map((tf) => (
                  <button key={tf} className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-1.5 py-0.5 text-[10px] text-[var(--ink-primary)]">
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <button className="inline-flex items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]">
              <Settings size={12} />
              Settings
            </button>
          </div>

          <TradingChart symbol={compactSymbol} />

          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
            <div className="overflow-hidden rounded border border-[var(--line-soft)] bg-[var(--surface-2)]">
              <div className="border-b border-[var(--line-soft)] bg-[var(--surface-header)] px-3 py-2 text-xs font-bold uppercase text-[var(--ink-primary)]">
                Latest Stories For {activeSymbol}
              </div>
              <div className="divide-y divide-[var(--line-soft)]">
                {topStories.map((item) => (
                  <div key={item.id} className="px-3 py-2 text-xs">
                    <p className="font-semibold text-[var(--ink-primary)]">{item.headline}</p>
                    <p className="mt-0.5 text-[var(--ink-muted)]">{item.source} | {item.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded border border-[var(--line-soft)] bg-[var(--surface-2)]">
              <div className="border-b border-[var(--line-soft)] bg-[var(--surface-header)] px-3 py-2 text-xs font-bold uppercase text-[var(--ink-primary)]">
                Upcoming Events For {activeSymbol}
              </div>
              <div className="ff-scroll max-h-[235px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-2 py-1">Due</th>
                      <th className="px-2 py-1">Impact</th>
                      <th className="px-2 py-1">Event</th>
                      <th className="px-2 py-1 text-right">Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((event) => (
                      <tr key={event.id} className="border-t border-[var(--line-soft)]">
                        <td className="px-2 py-1 text-[var(--ink-primary)]">{event.time}</td>
                        <td className="px-2 py-1">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              event.impact === "high"
                                ? "bg-[var(--impact-high)]"
                                : event.impact === "medium"
                                  ? "bg-[var(--impact-medium)]"
                                  : "bg-[var(--impact-low)]"
                            }`}
                          />
                        </td>
                        <td className="px-2 py-1 text-[var(--ink-primary)]">{event.event}</td>
                        <td className="px-2 py-1 text-right text-[var(--ink-muted)]">{event.forecast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="ff-panel overflow-hidden">
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2 text-xs font-bold uppercase text-[var(--ink-primary)]">
              Market Pair Selector
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "NZD/USD", "USD/CAD", "XAU/USD"].map((pair) => (
                <button
                  key={pair}
                  onClick={() => setActiveSymbol(pair)}
                  className={`rounded border px-2 py-2 text-xs font-semibold ${
                    activeSymbol === pair
                      ? "border-[var(--brand)] bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                      : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          <div className="ff-panel overflow-hidden">
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2 text-xs font-bold uppercase text-[var(--ink-primary)]">
              Positions For {activeSymbol}
            </div>
            <div className="space-y-2 p-3 text-xs">
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-2">
                <p className="text-[var(--ink-muted)]">Retail Long</p>
                <p className="text-xl font-bold text-[var(--ink-primary)]">42%</p>
              </div>
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-2">
                <p className="text-[var(--ink-muted)]">Retail Short</p>
                <p className="text-xl font-bold text-[var(--ink-primary)]">58%</p>
              </div>
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-2">
                <p className="text-[var(--ink-muted)]">Vol / 24h</p>
                <p className="text-xl font-bold text-[var(--ink-primary)]">4.82K</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}


