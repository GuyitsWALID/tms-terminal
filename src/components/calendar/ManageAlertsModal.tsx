"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, CheckCircle2, Clock, X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEconomicCalendarWithMeta } from "@/lib/api/dataService";
import type { EconomicEvent, MarketKey } from "@/types";

// ─── helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tms-alert-scheduled-ids-v1";

const IMPACT_BADGE: Record<EconomicEvent["impact"], string> = {
  high: "ff-impact-high",
  medium: "ff-impact-medium",
  low: "ff-impact-low",
};

/** Parse "10:30 AM" + eventDate "2026-04-23" → Date in local time. */
function parseEventTimestamp(event: EconomicEvent): Date | null {
  if (!event.eventDate) return null;
  const [year, month, day] = event.eventDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) {
    // All-day / unknown time → set to 23:59
    return new Date(year, month - 1, day, 23, 59, 0, 0);
  }

  const [, hourRaw, minuteRaw, periodRaw] = timeMatch;
  const period = periodRaw.toUpperCase();
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/** Milliseconds until 5 minutes before the event. Negative if it's too late. */
function msUntilAlert(event: EconomicEvent): number {
  const ts = parseEventTimestamp(event);
  if (!ts) return -1;
  return ts.getTime() - 5 * 60 * 1000 - Date.now();
}

function formatEventTime(event: EconomicEvent): string {
  return event.time || "—";
}

// ─── types ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  market: MarketKey;
}

type AlertState = "idle" | "denied" | "scheduled" | "fired" | "too-late";

// ─── component ────────────────────────────────────────────────────────────

export default function ManageAlertsModal({ isOpen, onClose, market }: Props) {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  /** Map of event.id → alert state */
  const [alertStates, setAlertStates] = useState<Record<string, AlertState>>({});
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const backdropRef = useRef<HTMLDivElement>(null);

  // ── sync permission from browser ────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  // ── load persisted alert IDs ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw) as string[];
      setAlertStates((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          if (!next[id]) next[id] = "scheduled";
        });
        return next;
      });
    } catch {
      /* ignore */
    }
  }, [isOpen]);

  // ── fetch today's high-impact events ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchEconomicCalendarWithMeta({
          date: new Date(),
          scope: "day",
          market,
        });
        if (cancelled) return;
        const highImpact = result.events.filter((e) => e.impact === "high" || e.impact === "medium");
        setEvents(highImpact);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, market]);

  // ── cleanup timeouts on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // ── close on backdrop click ─────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  // ── close on Escape ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const persistScheduled = useCallback((ids: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, []);

  const scheduleAlert = useCallback(
    async (event: EconomicEvent) => {
      // 1. Request permission if not yet granted
      let perm = permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }

      if (perm === "denied") {
        setAlertStates((prev) => ({ ...prev, [event.id]: "denied" }));
        return;
      }

      // 2. Calculate delay
      const delay = msUntilAlert(event);
      if (delay < 0) {
        setAlertStates((prev) => ({ ...prev, [event.id]: "too-late" }));
        return;
      }

      // 3. Schedule the notification
      setAlertStates((prev) => ({ ...prev, [event.id]: "scheduled" }));

      // Update localStorage
      const currentIds = (() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? (JSON.parse(raw) as string[]) : [];
        } catch {
          return [];
        }
      })();
      if (!currentIds.includes(event.id)) {
        persistScheduled([...currentIds, event.id]);
      }

      // Cancel any existing timer
      if (timeoutRefs.current[event.id]) {
        clearTimeout(timeoutRefs.current[event.id]);
      }

      timeoutRefs.current[event.id] = setTimeout(() => {
        try {
          new Notification(`⚡ ${event.event} in 5 minutes`, {
            body: `${event.currency} | ${event.time} | Impact: HIGH`,
            icon: "/TMSLOGO.png",
            tag: event.id,
          });
        } catch {
          /* Notification blocked silently */
        }
        setAlertStates((prev) => ({ ...prev, [event.id]: "fired" }));
        // Remove from localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const ids = raw ? (JSON.parse(raw) as string[]) : [];
          persistScheduled(ids.filter((id) => id !== event.id));
        } catch {
          /* ignore */
        }
      }, delay);
    },
    [permission, persistScheduled]
  );

  const cancelAlert = useCallback((eventId: string) => {
    if (timeoutRefs.current[eventId]) {
      clearTimeout(timeoutRefs.current[eventId]);
      delete timeoutRefs.current[eventId];
    }
    setAlertStates((prev) => ({ ...prev, [eventId]: "idle" }));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.filter((id) => id !== eventId)));
    } catch {
      /* ignore */
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Manage Event Alerts"
    >
      <div
        className="ff-panel ff-scroll flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[var(--ink-primary)]" />
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">
              Manage Event Alerts
            </h2>
            <span className="rounded border border-[#ff4b5544] bg-[#ff4b5512] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ff8a8f]">
              High &amp; Medium · Today
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-1.5 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
            aria-label="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Permission Banner ─────────────────────────────────────────── */}
        {permission === "denied" && (
          <div className="shrink-0 border-b border-[#ff4b5544] bg-[#ff4b5510] px-4 py-2.5 text-xs text-[#ff9ea3]">
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle size={12} />
              <span>Browser notifications are blocked. Please allow notifications in your browser settings to use this feature.</span>
            </span>
          </div>
        )}
        {permission === "default" && (
          <div className="shrink-0 border-b border-[#ffb34744] bg-[#ffb34710] px-4 py-2.5 text-xs text-[#ffd28e]">
            <span className="inline-flex items-center gap-1.5">
              <Bell size={12} />
              <span>Click <strong>Notify</strong> next to any event to enable browser notifications. You&apos;ll be prompted once for permission.</span>
            </span>
          </div>
        )}
        {permission === "granted" && (
          <div className="shrink-0 border-b border-[#2ecf8744] bg-[#2ecf8710] px-4 py-2.5 text-xs text-[#5de6a7]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>Notifications enabled. You&apos;ll receive a browser alert 5 minutes before each scheduled event.</span>
            </span>
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface-2)] p-3">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--ink-muted)]">
              <Loader2 size={16} className="animate-spin" />
              Loading today&apos;s high-impact events…
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded border border-[#ff4b5544] bg-[#ff4b5510] p-4 text-sm text-[#ff9ea3]">
              <AlertTriangle size={14} className="mr-1.5 inline" />
              {error}
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-[var(--ink-muted)]">
              <Bell size={28} className="opacity-25" />
              <p className="font-semibold">No high or medium impact events today</p>
              <p className="text-xs">Check back on the next active trading day.</p>
            </div>
          )}

          {!isLoading && events.length > 0 && (
            <div className="space-y-2">
              {events.map((event) => {
                const state = alertStates[event.id] ?? "idle";
                const delay = msUntilAlert(event);
                const isPast = delay < 0;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-3 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-3 transition-opacity",
                      isPast && "opacity-50"
                    )}
                  >
                    {/* Impact badge */}
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${IMPACT_BADGE[event.impact]}`}
                    >
                      {event.impact}
                    </span>

                    {/* Event info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                        {event.event}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-muted)]">
                        <span className="font-semibold text-[var(--ink-primary)]">
                          {event.currency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatEventTime(event)}
                        </span>
                        {event.forecast && event.forecast !== "—" && (
                          <span>Forecast: <span className="text-[var(--ink-primary)]">{event.forecast}</span></span>
                        )}
                        {event.actual && event.actual !== "—" && (
                          <span>Actual: <span className="font-semibold text-[#2ecf87]">{event.actual}</span></span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0">
                      {isPast ? (
                        <span className="rounded border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                          Released
                        </span>
                      ) : state === "scheduled" ? (
                        <button
                          type="button"
                          onClick={() => cancelAlert(event.id)}
                          className="flex items-center gap-1.5 rounded border border-[#2ecf8744] bg-[#2ecf8715] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#5de6a7] transition-colors hover:bg-[#ff4b5515] hover:border-[#ff4b5544] hover:text-[#ff9ea3]"
                          title="Cancel this alert"
                        >
                          <CheckCircle2 size={12} />
                          Scheduled
                        </button>
                      ) : state === "fired" ? (
                        <span className="flex items-center gap-1.5 rounded border border-[var(--line-soft)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                          <Bell size={12} />
                          Sent
                        </span>
                      ) : state === "denied" ? (
                        <span className="flex items-center gap-1.5 rounded border border-[#ff4b5544] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ff9ea3]">
                          <BellOff size={12} />
                          Blocked
                        </span>
                      ) : state === "too-late" ? (
                        <span className="rounded border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                          Too Late
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void scheduleAlert(event)}
                          className="flex items-center gap-1.5 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                        >
                          <Bell size={12} />
                          Notify
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2.5">
          <p className="text-[10px] text-[var(--ink-muted)]">
            Alerts are scheduled in-browser for this session. Reloading the page will clear pending timers.
          </p>
        </div>
      </div>
    </div>
  );
}
