"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bell, Calendar as CalendarIcon, ChevronDown, Folder, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { endOfWeek, format, isSameMonth, isWithinInterval, startOfWeek } from "date-fns";
import type { DateRange } from "react-day-picker";
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

const parseEventDate = (date: string | undefined) => {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export default function EconomicCalendar() {
  const [isHydrated, setIsHydrated] = useState(false);
  const currentMonthAnchor = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  const [starredEvents, setStarredEvents] = useState<Set<string>>(new Set(["ec-02"]));
  const [events, setEvents] = useState<EconomicEvent[]>(calendarEvents);
  const [activeEventId, setActiveEventId] = useState<string>(calendarEvents[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"week" | "month" | "day">("month");
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusDate, setFocusDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [calendarSource, setCalendarSource] = useState<string>("unknown");
  const [calendarCache, setCalendarCache] = useState<string>("unknown");
  const [fallbackReason, setFallbackReason] = useState<string>("");
  const [detailModalEvent, setDetailModalEvent] = useState<EconomicEvent | null>(null);
  const [detailModalLoading, setDetailModalLoading] = useState(false);
  const [detailModalData, setDetailModalData] = useState<EconomicEvent["scrapedDetail"] | null>(null);

  const fetchAnchorDate = currentMonthAnchor;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const loadCalendar = async () => {
      setIsLoading(true);
      try {
        const result = await fetchEconomicCalendarWithMeta({
          date: fetchAnchorDate,
          scope: "month",
        });

        if (!isMounted) return;

        setCalendarSource(result.source);
        setCalendarCache(result.cache);
        setFallbackReason(result.fallbackReason);

        const monthJobPending =
          result.source === "forexfactory-export" && result.fallbackReason.includes("month-job-pending");

        if (Array.isArray(result.events) && result.events.length > 0) {
          setEvents(
            result.events.map((event) => ({
              ...event,
              verifiedOpinion: event.verifiedOpinion ?? "Live data connected. Analyst notes will appear when available.",
              isStarred: event.isStarred ?? false,
            }))
          );
          setActiveEventId((current) => current || result.events[0].id);
          setErrorMessage(null);

          if (monthJobPending && isMounted) {
            retryTimer = setTimeout(() => {
              void loadCalendar();
            }, 8000);
          }

          return;
        }

        setErrorMessage("No events returned for this month from source. Showing latest available feed.");
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
      if (retryTimer) clearTimeout(retryTimer);
      isMounted = false;
    };
  }, [fetchAnchorDate]);

  const normalizedRange = useMemo(() => {
    if (!selectedRange?.from) return null;

    const from = new Date(selectedRange.from.getFullYear(), selectedRange.from.getMonth(), selectedRange.from.getDate());
    if (!selectedRange.to) return { from, to: null as Date | null };

    const to = new Date(selectedRange.to.getFullYear(), selectedRange.to.getMonth(), selectedRange.to.getDate());
    return from <= to ? { from, to } : { from: to, to: from };
  }, [selectedRange]);

  const dateScopedEvents = useMemo(() => {
    const monthRows = events.filter((event) => {
      const eventDate = parseEventDate(event.eventDate);
      return eventDate ? isSameMonth(eventDate, currentMonthAnchor) : false;
    });
    const availableRows = monthRows.length > 0 ? monthRows : events;

    if (viewMode === "month") return availableRows;

    if (viewMode === "week") {
      const weekStart = startOfWeek(focusDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(focusDate, { weekStartsOn: 1 });
      const weekRows = availableRows.filter((event) => {
        const eventDate = parseEventDate(event.eventDate);
        return eventDate ? isWithinInterval(eventDate, { start: weekStart, end: weekEnd }) : false;
      });

      if (weekRows.length > 0) return weekRows;

      const firstEventDate = parseEventDate(availableRows[0]?.eventDate);
      if (!firstEventDate) return availableRows;

      const sourceWeekStart = startOfWeek(firstEventDate, { weekStartsOn: 1 });
      const sourceWeekEnd = endOfWeek(firstEventDate, { weekStartsOn: 1 });
      return availableRows.filter((event) => {
        const eventDate = parseEventDate(event.eventDate);
        return eventDate ? isWithinInterval(eventDate, { start: sourceWeekStart, end: sourceWeekEnd }) : false;
      });
    }

    if (!normalizedRange?.from || !normalizedRange.to) return [];
    const rangeEnd = normalizedRange.to;

    return availableRows.filter((event) => {
      const eventDate = parseEventDate(event.eventDate);
      return eventDate ? isWithinInterval(eventDate, { start: normalizedRange.from, end: rangeEnd }) : false;
    });
  }, [events, focusDate, viewMode, normalizedRange, currentMonthAnchor]);

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

  const dateTriggerLabel = useMemo(() => {
    if (!isHydrated) return "Loading date...";

    if (viewMode === "day") {
      if (!normalizedRange?.from) return "Pick a date range";
      if (!normalizedRange.to) return `Start: ${format(normalizedRange.from, "PPP")} (pick end date)`;
      if (normalizedRange.from.getTime() === normalizedRange.to.getTime()) return format(normalizedRange.from, "PPP");
      return `${format(normalizedRange.from, "MMM d, yyyy")} - ${format(normalizedRange.to, "MMM d, yyyy")}`;
    }

    return format(focusDate, "PPP");
  }, [viewMode, normalizedRange, focusDate, isHydrated]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from) setFocusDate(range.from);
  };

  const handleDayDoubleClick = (day: Date) => {
    const singleDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    setSelectedRange({ from: singleDay, to: singleDay });
    setFocusDate(singleDay);
  };

  const tableTitle = viewMode === "month" ? "This Month: Economic Calendar" : viewMode === "day" ? "Selected Range: Economic Calendar" : "This Week: Economic Calendar";

  const openDetailModal = async (event: EconomicEvent) => {
    setDetailModalEvent(event);
    setDetailModalData(event.scrapedDetail ?? null);

    if (!event.detailId) return;

    setDetailModalLoading(true);
    try {
      const response = await fetch(`/api/calendar/detail?event_id=${encodeURIComponent(event.detailId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("detail fetch failed");
      const detail = (await response.json()) as EconomicEvent["scrapedDetail"];
      setDetailModalData(detail);
    } catch {
      setDetailModalData({
        source: "Detail scrape unavailable right now.",
        whyTradersCare: "The source detail panel is currently protected or unavailable.",
      });
    } finally {
      setDetailModalLoading(false);
    }
  };

  return (
    <>
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
                <span className="rounded border border-[#ff9d7a55] bg-[#ff9d7a12] px-2 py-0.5 text-[#ffb38f]">Note: {fallbackReason}</span>
              ) : null}
              {viewMode === "day" && normalizedRange?.from && !normalizedRange.to ? (
                <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-0.5 text-[var(--ink-muted)]">
                  Range mode: pick an end date, or double-click any date for single-day mode.
                </span>
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
                onClick={() => setViewMode("month")}
                className={cn(
                  "border-l border-[var(--line-soft)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                  viewMode === "month" ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]" : "bg-[var(--surface-1)] text-[var(--ink-muted)]"
                )}
              >
                Month
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
                  className="h-8 w-[260px] justify-start gap-1.5 px-2.5 text-left text-[13px] font-normal text-[var(--ink-primary)]"
                >
                  <CalendarIcon size={14} className="opacity-75" />
                  <span className="truncate">{dateTriggerLabel}</span>
                  <ChevronDown size={14} className="ml-auto opacity-65" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                {viewMode === "day" ? (
                  <Calendar
                    mode="range"
                    selected={selectedRange}
                    onSelect={handleRangeSelect}
                    onDayClick={(day, _modifiers, event) => {
                      if (event.detail === 2) handleDayDoubleClick(day);
                    }}
                    defaultMonth={currentMonthAnchor}
                    fromMonth={currentMonthAnchor}
                    toMonth={currentMonthAnchor}
                    initialFocus
                  />
                ) : (
                  <Calendar
                    mode="single"
                    selected={focusDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setFocusDate(date);
                    }}
                    defaultMonth={currentMonthAnchor}
                    fromMonth={currentMonthAnchor}
                    toMonth={currentMonthAnchor}
                    initialFocus
                  />
                )}
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
            <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">{tableTitle}</h2>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void openDetailModal(event);
                        }}
                        className="inline-flex items-center justify-center rounded p-1 hover:bg-[var(--surface-hover)]"
                        title="Open event detail"
                        aria-label={`Open detail for ${event.event}`}
                      >
                        <Folder size={14} className={IMPACT_FOLDER_COLORS[event.impact]} />
                      </button>
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

      {detailModalEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setDetailModalEvent(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded border border-[var(--line-strong)] bg-[var(--surface-2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3">
              <h3 className="font-rajdhani text-2xl font-bold text-[var(--ink-primary)]">{detailModalEvent.event}</h3>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {detailModalEvent.currency} | {detailModalEvent.time} | Impact: {detailModalEvent.impact.toUpperCase()}
              </p>
            </div>

            <div className="space-y-4 p-4">
              <section className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <h4 className="ff-panel-title text-sm text-[var(--ink-primary)]">Scraped Event Detail</h4>
                {detailModalLoading ? <p className="mt-2 text-sm text-[var(--ink-muted)]">Loading detail...</p> : null}
                {!detailModalLoading ? (
                  <div className="mt-2 grid gap-2 text-sm">
                    <p><span className="font-semibold text-[var(--ink-primary)]">Source:</span> {detailModalData?.source ?? "-"}</p>
                    <p><span className="font-semibold text-[var(--ink-primary)]">Usual Effect:</span> {detailModalData?.usualEffect ?? "-"}</p>
                    <p><span className="font-semibold text-[var(--ink-primary)]">Frequency:</span> {detailModalData?.frequency ?? "-"}</p>
                    <p><span className="font-semibold text-[var(--ink-primary)]">Next Release:</span> {detailModalData?.nextRelease ?? "-"}</p>
                    <p><span className="font-semibold text-[var(--ink-primary)]">FF Notes:</span> {detailModalData?.ffNotes ?? "-"}</p>
                    <p><span className="font-semibold text-[var(--ink-primary)]">Why Traders Care:</span> {detailModalData?.whyTradersCare ?? "-"}</p>
                  </div>
                ) : null}
              </section>

              <section className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <h4 className="ff-panel-title text-sm text-[var(--ink-primary)]">Verified Perspective</h4>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Reserved for verified analyst perspective. This section will be wired after login and verified-user roles are configured.
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
