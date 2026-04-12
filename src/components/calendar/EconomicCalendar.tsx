"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Calendar as CalendarIcon, ChevronDown, Folder, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { calendarEvents, marketSentiment, sessions } from "@/lib/terminalData";
import { fetchEconomicCalendarWithMeta } from "@/lib/api/dataService";
import type { EconomicEvent } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "../ui/calendar";
import { Button } from "@/components/ui/button";

const IMPACT_COLORS = {
  high: "ff-impact-high",
  medium: "ff-impact-medium",
  low: "ff-impact-low",
};

const IMPACT_FOLDER_COLORS = {
  high: "text-[#ff636c]",
  medium: "text-[#ffb347]",
  low: "text-[#ffd84d]",
};

export default function EconomicCalendar() {
  const [starredEvents, setStarredEvents] = useState<Set<string>>(new Set(["ec-02"]));
  const [events, setEvents] = useState<EconomicEvent[]>(calendarEvents);
  const [activeEventId, setActiveEventId] = useState<string>(calendarEvents[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const initialDateRef = useRef<Date | undefined>(new Date());
  const [calendarSource, setCalendarSource] = useState<string>("unknown");
  const [calendarCache, setCalendarCache] = useState<string>("unknown");
  const [fallbackReason, setFallbackReason] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const loadCalendar = async () => {
      setIsLoading(true);
      try {
        const result = await fetchEconomicCalendarWithMeta(initialDateRef.current);
        const liveEvents = result.events;
        if (!isMounted) return;

        setCalendarSource(result.source);
        setCalendarCache(result.cache);
        setFallbackReason(result.fallbackReason);

        if (Array.isArray(liveEvents) && liveEvents.length > 0) {
          setEvents(
            liveEvents.map((event) => ({
              ...event,
              verifiedOpinion: event.verifiedOpinion ?? "Live data connected. Analyst notes will appear when available.",
              isStarred: event.isStarred ?? false,
            }))
          );
          setActiveEventId((current) => current || liveEvents[0].id);
          setErrorMessage(null);
          return;
        }

        setErrorMessage("Calendar API returned no events. Showing fallback data.");
      } catch (error: unknown) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Unknown calendar error";
        setErrorMessage(`${message}. Showing fallback data.`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCalendar();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const dateScopedEvents = useMemo(() => {
    if (viewMode === "week") return events;
    if (!selectedDateKey) return events;
    return events.filter((event) => event.eventDate === selectedDateKey);
  }, [events, viewMode, selectedDateKey]);

  const filteredEvents = useMemo(
    () => dateScopedEvents.filter((event) => impactFilter === "all" || event.impact === impactFilter),
    [dateScopedEvents, impactFilter]
  );

  const activeEvent = useMemo(() => {
    return filteredEvents.find((event) => event.id === activeEventId) ?? filteredEvents[0] ?? dateScopedEvents[0] ?? events[0] ?? calendarEvents[0];
  }, [filteredEvents, dateScopedEvents, events, activeEventId]);

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
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Live releases, verified opinions, and pre-event alerts.</p>
            {isLoading ? <p className="mt-1 text-xs text-[var(--ink-muted)]">Syncing live calendar...</p> : null}
            {errorMessage ? <p className="mt-1 text-xs text-[#ff9d7a]">{errorMessage}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-0.5 text-[var(--ink-muted)]">
                Source: <span className="font-semibold text-[var(--ink-primary)]">{calendarSource}</span>
              </span>
              <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-0.5 text-[var(--ink-muted)]">
                Cache: <span className="font-semibold text-[var(--ink-primary)]">{calendarCache}</span>
              </span>
              {fallbackReason ? (
                <span className="rounded border border-[#ff9d7a55] bg-[#ff9d7a12] px-2 py-0.5 text-[#ffb38f]">Fallback: {fallbackReason}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded border border-[var(--line-soft)]">
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                  viewMode === "week" ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]" : "bg-[var(--surface-1)] text-[var(--ink-muted)]"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={cn(
                  "border-l border-[var(--line-soft)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                  viewMode === "day" ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]" : "bg-[var(--surface-1)] text-[var(--ink-muted)]"
                )}
              >
                Selected Day
              </button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!selectedDate}
                  className="h-8 w-[220px] justify-start gap-1.5 px-2.5 text-left text-[13px] font-normal text-[var(--ink-primary)] data-[empty=true]:text-[var(--ink-muted)]"
                >
                  <CalendarIcon size={14} className="opacity-75" />
                  <span className="truncate">{selectedDate ? format(selectedDate, "PPP") : "Pick a date"}</span>
                  <ChevronDown size={14} className="ml-auto opacity-65" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>

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
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-1.5">
            <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">This Week: Economic Calendar</h2>
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
                  <th className="px-3 py-2 text-center">Detail</th>
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
                    onClick={() => setActiveEventId(event.id)}
                    className={cn(
                      "cursor-pointer hover:bg-[var(--surface-hover)]",
                      activeEvent?.id === event.id && "bg-[var(--surface-hover)]"
                    )}
                  >
                    <td className="px-3 py-2 font-semibold">{event.time}</td>
                    <td className="px-3 py-2 font-semibold text-[var(--ink-primary)]">{event.currency}</td>
                    <td className="px-3 py-2 text-[var(--ink-primary)]">{event.event}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${IMPACT_COLORS[event.impact]}`}>{event.impact}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Folder size={14} className={`mx-auto ${IMPACT_FOLDER_COLORS[event.impact]}`} />
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
            <p className="font-semibold text-[var(--ink-primary)]">{activeEvent?.event}</p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{activeEvent?.verifiedOpinion ?? "Live event loaded. Insight pending from trusted analysts."}</p>
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