"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import {
  featuredNews,
  forumsMostReplied,
  hotStory,
  majorPairs,
  type PairCard,
  marketSentiment,
  sessions,
  calendarEvents,
} from "@/lib/terminalData";
import { fetchEconomicCalendar } from "@/lib/api/dataService";
import type { EconomicEvent } from "@/types";
import { useLiveTickers } from "@/hooks/useLiveTickers";

const impactClass = {
  high: "ff-impact-high",
  medium: "ff-impact-medium",
  low: "ff-impact-low",
};

const impactFolderColor = {
  high: "text-[#ff636c]",
  medium: "text-[#ffb347]",
  low: "text-[#ffd84d]",
};

export default function Home() {
  const [liveCalendarEvents, setLiveCalendarEvents] = useState<EconomicEvent[]>(calendarEvents);
  const { tickers } = useLiveTickers(1000);

  const liveMajors = useMemo<PairCard[]>(() => {
    const bySymbol = new Map<string, (typeof tickers)[number]>(tickers.map((ticker) => [ticker.symbol, ticker]));

    return majorPairs.map((pair) => {
      const compact = pair.symbol.replace("/", "");
      const ticker = bySymbol.get(compact);

      if (!ticker) return pair;

      return {
        ...pair,
        bid: ticker.price,
        change6h: ticker.change,
        direction: ticker.isUp ? "up" : "down",
      };
    });
  }, [tickers]);

  useEffect(() => {
    let isMounted = true;

    const loadCalendar = async () => {
      try {
        const events = await fetchEconomicCalendar();
        if (!isMounted) return;
        if (Array.isArray(events) && events.length > 0) {
          setLiveCalendarEvents(events);
        }
      } catch {
        // Keep static fallback on failure.
      }
    };

    loadCalendar();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-3">
      <section className="ff-panel overflow-hidden">
        <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-primary)]">
          Majors
        </div>
        <div className="ff-scroll grid grid-cols-2 divide-x divide-y divide-[var(--line-soft)] overflow-x-auto md:grid-cols-4 xl:grid-cols-8 xl:divide-y-0">
          {liveMajors.map((pair) => (
            <div key={pair.symbol} className="min-w-[160px] bg-[var(--surface-2)] px-3 py-3">
              <p className="font-rajdhani text-lg font-bold leading-none text-[var(--ink-primary)]">{pair.symbol}</p>
              <p className="mt-2 font-mono text-lg text-[var(--ink-primary)]">{pair.bid}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                <span>Spread {pair.spread}</span>
                <span className={pair.direction === "up" ? "text-[#34d58c]" : "text-[#ff7c7c]"}>{pair.change6h}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="ff-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">News / Latest Stories</h2>
            <Link href="/news" className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)]">View All</Link>
          </div>
          <div className="divide-y divide-[var(--line-soft)]">
            {featuredNews.slice(0, 5).map((item) => (
              <div key={item.id} className="bg-[var(--surface-2)] px-4 py-3 text-sm hover:bg-[var(--surface-hover)]">
                <p className="font-semibold text-[var(--ink-primary)]">{item.headline}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{item.source} | {item.timestamp} | {item.category}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ff-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">News / Hot Story</h2>
            <span className="rounded bg-[var(--brand-strong)] px-2 py-0.5 text-[10px] font-bold uppercase">Live</span>
          </div>
          <div className="grid gap-4 bg-[var(--surface-2)] p-4 md:grid-cols-[140px_minmax(0,1fr)]">
            <div className="h-32 rounded border border-[var(--line-strong)] bg-gradient-to-br from-[var(--surface-hover)] to-[var(--surface-3)]" />
            <div>
              <h3 className="font-rajdhani text-2xl font-bold leading-tight text-[var(--ink-primary)]">{hotStory.title}</h3>
              <p className="mt-2 text-xs text-[var(--ink-muted)]">{hotStory.source} | {hotStory.age}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{hotStory.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ff-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Today: Apr 12</h2>
          <div className="flex gap-2 text-[11px] text-[var(--ink-muted)]">
            <span>Search Events</span>
            <span>Filter</span>
          </div>
        </div>
        <div className="ff-scroll overflow-x-auto bg-[var(--surface-2)]">
          <table className="ff-table min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Currency</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2 text-center">Impact</th>
                <th className="px-3 py-2 text-center">Detail</th>
                <th className="px-3 py-2 text-center">Actual</th>
                <th className="px-3 py-2 text-center">Forecast</th>
                <th className="px-3 py-2 text-center">Previous</th>
              </tr>
            </thead>
            <tbody>
              {liveCalendarEvents.map((event) => (
                <tr key={event.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-3 py-2 font-semibold">{event.time}</td>
                  <td className="px-3 py-2 font-semibold text-[var(--ink-primary)]">{event.currency}</td>
                  <td className="px-3 py-2 text-[var(--ink-primary)]">{event.event}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${impactClass[event.impact]}`}>{event.impact}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Folder size={14} className={`mx-auto ${impactFolderColor[event.impact]}`} />
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-[var(--ink-primary)]">{event.actual}</td>
                  <td className="px-3 py-2 text-center font-mono text-[var(--ink-muted)]">{event.forecast}</td>
                  <td className="px-3 py-2 text-center font-mono text-[var(--ink-muted)]">{event.previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="ff-panel overflow-hidden">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Sessions / Liquidity Pulse</h2>
          </div>
          <div className="space-y-3 bg-[var(--surface-2)] p-4">
            <div className="relative h-20 rounded border border-[var(--line-strong)] bg-[var(--surface-3)]">
              <div className="absolute left-[18%] top-3 h-14 w-[26%] rounded bg-[color:color-mix(in_srgb,var(--line-strong)_32%,transparent)]" />
              <div className="absolute left-[40%] top-3 h-14 w-[34%] rounded bg-[#2ecf8733]" />
              <div className="absolute left-[62%] top-3 h-14 w-[24%] rounded bg-[#ff9d2d33]" />
              <div className="absolute bottom-1 left-2 text-[10px] text-[var(--ink-muted)]">Sydney</div>
              <div className="absolute bottom-1 left-[37%] text-[10px] text-[var(--ink-muted)]">Tokyo</div>
              <div className="absolute bottom-1 left-[58%] text-[10px] text-[var(--ink-muted)]">London</div>
              <div className="absolute bottom-1 right-3 text-[10px] text-[var(--ink-muted)]">New York</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              {sessions.map((session) => (
                <div key={session.name} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-2">
                  <p className="font-semibold text-[var(--ink-primary)]">{session.name}</p>
                  <p className="text-[var(--ink-muted)]">{session.range}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ff-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Forums / Most Replied 12H</h2>
            <Link href="/forum" className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)]">Open Forum</Link>
          </div>
          <div className="space-y-2 bg-[var(--surface-2)] p-3">
            {forumsMostReplied.map((thread) => (
              <div key={thread.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3 text-sm hover:bg-[var(--surface-hover)]">
                <p className="font-semibold text-[var(--ink-primary)]">{thread.title}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{thread.author} | {thread.category}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{thread.replies.toLocaleString()} replies | {thread.lastReply}</p>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              {marketSentiment.slice(0, 2).map((row) => (
                <div key={row.pair} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-2">
                  <p className="font-semibold text-[var(--ink-primary)]">{row.pair}</p>
                  <p className="text-[#34d58c]">Long {row.long}%</p>
                  <p className="text-[#ff7b7b]">Short {row.short}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Link href="/calendar" className="inline-flex items-center gap-2 rounded-md border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]">
          Open Full Calendar
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}



