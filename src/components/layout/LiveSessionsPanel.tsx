"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketKey } from "@/types";
import { cn } from "@/lib/utils";
import {
  TIME_PREFERENCES_EVENT,
  type TimePreferences,
  formatDateWithPreferences,
  getTimeZoneLabel,
  readTimePreferences,
} from "@/lib/timePreferences";

type SessionDef = {
  name: "Sydney" | "Tokyo" | "London" | "New York";
  startUtcHour: number;
  endUtcHour: number;
  color: string;
  weight: number;
};

type SessionState = SessionDef & {
  active: boolean;
  progressPct: number;
  rangeLabel: string;
};

type LiveSessionsPanelProps = {
  market: MarketKey;
  compact?: boolean;
  showTraders?: boolean;
  className?: string;
};

const SESSION_DEFS: SessionDef[] = [
  { name: "Sydney", startUtcHour: 22, endUtcHour: 7, color: "#6aa4ff", weight: 0.5 },
  { name: "Tokyo", startUtcHour: 0, endUtcHour: 9, color: "#2ecf87", weight: 0.75 },
  { name: "London", startUtcHour: 7, endUtcHour: 16, color: "#ffb347", weight: 1 },
  { name: "New York", startUtcHour: 13, endUtcHour: 22, color: "#ff6a6a", weight: 1.15 },
];

const MARKET_BASE_TRADERS: Record<MarketKey, number> = {
  forex: 18500,
  crypto: 23100,
  commodities: 14200,
  stocks: 14200,
};

const toUtcMinutes = (date: Date) => date.getUTCHours() * 60 + date.getUTCMinutes();

const sessionDurationMinutes = (startHour: number, endHour: number) => {
  const start = startHour * 60;
  const end = endHour * 60;
  if (end > start) return end - start;
  return 1440 - start + end;
};

const inSession = (currentMinutes: number, startHour: number, endHour: number) => {
  const start = startHour * 60;
  const end = endHour * 60;
  if (end > start) return currentMinutes >= start && currentMinutes < end;
  return currentMinutes >= start || currentMinutes < end;
};

const sessionProgress = (currentMinutes: number, startHour: number, endHour: number) => {
  const start = startHour * 60;
  const duration = sessionDurationMinutes(startHour, endHour);

  let elapsed: number;
  if (currentMinutes >= start) {
    elapsed = currentMinutes - start;
  } else {
    elapsed = 1440 - start + currentMinutes;
  }

  return Math.max(0, Math.min(100, (elapsed / duration) * 100));
};

const segmentStyle = (startMin: number, endMin: number) => {
  return {
    left: `${(startMin / 1440) * 100}%`,
    width: `${((endMin - startMin) / 1440) * 100}%`,
  };
};

const HYDRATION_SAFE_TIME_PREFERENCES: TimePreferences = { timeZone: "UTC", timeFormat: "ampm" };

const formatSessionRange = (startHour: number, endHour: number, preferences: TimePreferences, referenceDate: Date) => {
  const baseUtcDate = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate(), 0, 0, 0, 0)
  );

  const startUtc = new Date(baseUtcDate.getTime() + startHour * 60 * 60 * 1000);
  const endUtc = new Date(baseUtcDate.getTime() + endHour * 60 * 60 * 1000);

  const start = formatDateWithPreferences(startUtc, preferences, { hour: "2-digit", minute: "2-digit" });
  const end = formatDateWithPreferences(endUtc, preferences, { hour: "2-digit", minute: "2-digit" });

  return `${start} - ${end}`;
};

export default function LiveSessionsPanel({
  market,
  compact = false,
  showTraders = false,
  className,
}: LiveSessionsPanelProps) {
  const [now, setNow] = useState(() => new Date());
  const [timePreferences, setTimePreferences] = useState<TimePreferences>(HYDRATION_SAFE_TIME_PREFERENCES);

  const timeZoneLabel = getTimeZoneLabel(timePreferences.timeZone);

  useEffect(() => {
    const syncPrefs = window.setTimeout(() => {
      setTimePreferences(readTimePreferences());
    }, 0);

    return () => window.clearTimeout(syncPrefs);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onTimePreferencesChange = () => {
      setTimePreferences(readTimePreferences());
      setNow(new Date());
    };

    window.addEventListener(TIME_PREFERENCES_EVENT, onTimePreferencesChange as EventListener);

    return () => {
      window.removeEventListener(TIME_PREFERENCES_EVENT, onTimePreferencesChange as EventListener);
    };
  }, []);

  const currentMinutes = toUtcMinutes(now);

  const sessions = useMemo<SessionState[]>(() => {
    return SESSION_DEFS.map((def) => {
      const active = inSession(currentMinutes, def.startUtcHour, def.endUtcHour);
      return {
        ...def,
        active,
        progressPct: active ? sessionProgress(currentMinutes, def.startUtcHour, def.endUtcHour) : 0,
        rangeLabel: formatSessionRange(def.startUtcHour, def.endUtcHour, timePreferences, now),
      };
    });
  }, [currentMinutes, now, timePreferences]);

  const activeWeight = useMemo(() => sessions.reduce((acc, session) => acc + (session.active ? session.weight : 0), 0), [sessions]);

  const activeCount = useMemo(() => sessions.filter((session) => session.active).length, [sessions]);

  const estimatedTraderCount = useMemo(() => {
    const base = MARKET_BASE_TRADERS[market];
    const dailyWave = Math.sin((currentMinutes / 1440) * Math.PI * 2) * 0.06;
    const sessionFactor = 0.72 + activeWeight * 0.23;
    return Math.round(base * sessionFactor * (1 + dailyWave));
  }, [market, activeWeight, currentMinutes]);

  return (
    <div className={cn("rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Sessions</p>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">{timeZoneLabel}</span>
      </div>

      {showTraders ? (
        <div className="mb-3 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">Active Traders</p>
          <p className="mt-1 font-rajdhani text-3xl font-bold leading-none text-[var(--ink-primary)]">{estimatedTraderCount.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
            {activeCount} session{activeCount === 1 ? "" : "s"} open | session-based live estimate
          </p>
        </div>
      ) : null}

      <div className="mb-3 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-2">
        <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Session Bar Graph</p>
        <div className="relative h-14 overflow-hidden rounded border border-[var(--line-soft)] bg-[var(--surface-1)]">
          {SESSION_DEFS.map((session) => {
            const start = session.startUtcHour * 60;
            const end = session.endUtcHour * 60;
            const isActive = inSession(currentMinutes, session.startUtcHour, session.endUtcHour);

            if (end > start) {
              return (
                <div
                  key={session.name}
                  className={cn("absolute bottom-0 top-0 rounded-sm opacity-35", isActive && "opacity-70")}
                  style={{
                    ...segmentStyle(start, end),
                    backgroundColor: session.color,
                  }}
                  title={`${session.name} (${formatSessionRange(session.startUtcHour, session.endUtcHour, timePreferences, now)})`}
                />
              );
            }

            return (
              <div key={session.name}>
                <div
                  key={`${session.name}-a`}
                  className={cn("absolute bottom-0 top-0 rounded-sm opacity-35", isActive && "opacity-70")}
                  style={{
                    ...segmentStyle(start, 1440),
                    backgroundColor: session.color,
                  }}
                  title={`${session.name} (${formatSessionRange(session.startUtcHour, session.endUtcHour, timePreferences, now)})`}
                />
                <div
                  key={`${session.name}-b`}
                  className={cn("absolute bottom-0 top-0 rounded-sm opacity-35", isActive && "opacity-70")}
                  style={{
                    ...segmentStyle(0, end),
                    backgroundColor: session.color,
                  }}
                  title={`${session.name} (${formatSessionRange(session.startUtcHour, session.endUtcHour, timePreferences, now)})`}
                />
              </div>
            );
          })}

          <div
            className="absolute bottom-0 top-0 w-[2px] bg-white/80"
            style={{ left: `${(currentMinutes / 1440) * 100}%` }}
            title={`Current time in ${timeZoneLabel}`}
          />
        </div>
      </div>

      <div className={cn("space-y-2", compact && "space-y-1.5")}>
        {sessions.map((session) => (
          <div key={session.name} className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className={cn("font-semibold text-[var(--ink-primary)]", compact ? "text-xs" : "text-sm")}>{session.name}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  session.active ? "bg-[#2ecf87] text-[#062114]" : "bg-[var(--surface-1)] text-[var(--ink-muted)]"
                )}
              >
                {session.active ? "Live" : "Closed"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{session.rangeLabel}</p>
            {session.active ? (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-[var(--surface-1)]">
                <div className="h-full" style={{ width: `${session.progressPct}%`, backgroundColor: session.color }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
