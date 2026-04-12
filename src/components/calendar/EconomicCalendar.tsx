"use client";

import React, { useState } from "react";
import { Bell, MessageSquare, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarEvents, marketSentiment, sessions } from "@/lib/terminalData";

const IMPACT_COLORS = {
  high: "ff-impact-high",
  medium: "ff-impact-medium",
  low: "ff-impact-low",
};

export default function EconomicCalendar() {
  const [starredEvents, setStarredEvents] = useState<Set<string>>(new Set(["ec-02"]));
  const [activeEvent, setActiveEvent] = useState(calendarEvents[0]);
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filteredEvents = calendarEvents.filter((event) => impactFilter === "all" || event.impact === impactFilter);

  const toggleStar = (id: string) => {
    const newStarred = new Set(starredEvents);
    if (newStarred.has(id)) newStarred.delete(id);
    else newStarred.add(id);
    setStarredEvents(newStarred);
  };

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none">Economic Calendar</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">High-density releases, verified opinions, and pre-event alerts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "high", "medium", "low"] as const).map((impact) => (
              <button
                key={impact}
                onClick={() => setImpactFilter(impact)}
                className={cn(
                  "rounded border px-2 py-1 text-xs font-bold uppercase tracking-wider",
                  impactFilter === impact
                    ? "border-[var(--brand)] bg-[var(--surface-hover)] text-white"
                    : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                )}
              >
                {impact}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="ff-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Today: Scheduled Releases</h2>
            <button className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-primary)]">
              <Bell size={12} className="mr-1 inline" />
              Alert All Starred
            </button>
          </div>

          <div className="ff-scroll overflow-x-auto bg-[var(--surface-2)]">
            <table className="ff-table min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--ink-muted)]">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2 text-center">Impact</th>
                  <th className="px-3 py-2 text-center">Actual</th>
                  <th className="px-3 py-2 text-center">Forecast</th>
                  <th className="px-3 py-2 text-center">Previous</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setActiveEvent(event)}
                    className={cn("cursor-pointer hover:bg-[var(--surface-hover)]", activeEvent.id === event.id && "bg-[var(--surface-hover)]")}
                  >
                    <td className="px-3 py-2 font-semibold">{event.time}</td>
                    <td className="px-3 py-2 font-semibold text-[var(--ink-primary)]">{event.currency}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[var(--ink-primary)]">
                        {event.event}
                        {event.verifiedOpinion ? <MessageSquare size={12} className="text-[var(--ink-primary)]" /> : null}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${IMPACT_COLORS[event.impact]}`}>{event.impact}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-[var(--ink-primary)]">{event.actual}</td>
                    <td className="px-3 py-2 text-center font-mono text-[var(--ink-muted)]">{event.forecast}</td>
                    <td className="px-3 py-2 text-center font-mono text-[var(--ink-muted)]">{event.previous}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(event.id);
                        }}
                        className={cn(
                          "rounded p-1.5",
                          starredEvents.has(event.id) ? "bg-[#ffcf3b22] text-[#ffd44d]" : "text-[var(--ink-muted)] hover:bg-[var(--surface-hover)]"
                        )}
                      >
                        <Star size={14} fill={starredEvents.has(event.id) ? "currentColor" : "none"} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--ink-primary)]" />
              <h3 className="ff-panel-title text-sm">Verified Analyst Insight</h3>
            </div>
            <p className="font-semibold text-[var(--ink-primary)]">{activeEvent.event}</p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{activeEvent.verifiedOpinion}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] p-2">
                <p className="text-[var(--ink-muted)]">Confidence</p>
                <p className="font-semibold text-[var(--ink-primary)]">84%</p>
              </div>
              <div className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] p-2">
                <p className="text-[var(--ink-muted)]">Bias</p>
                <p className="font-semibold text-[#2fd488]">Bullish USD</p>
              </div>
            </div>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--ink-primary)]" />
              <h3 className="ff-panel-title text-sm">Retail Positioning</h3>
            </div>
            <div className="space-y-2">
              {marketSentiment.map((row) => (
                <div key={row.pair} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-2 text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink-primary)]">{row.pair}</span>
                    <span className="text-[var(--ink-muted)]">Long/Short</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-[var(--surface-1)]">
                    <div className="h-full bg-[#34d58c]" style={{ width: `${row.long}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-[#34d58c]">{row.long}% long</span>
                    <span className="text-[#ff7b7b]">{row.short}% short</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ff-panel p-3">
            <h3 className="ff-panel-title text-sm">Sessions</h3>
            <div className="mt-2 space-y-2 text-xs">
              {sessions.map((session) => (
                <div key={session.name} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink-primary)]">{session.name}</span>
                    <span className={session.active ? "text-[#2fd488]" : "text-[var(--ink-muted)]"}>{session.active ? "ACTIVE" : "CLOSED"}</span>
                  </div>
                  <p className="text-[var(--ink-muted)]">{session.range}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}



