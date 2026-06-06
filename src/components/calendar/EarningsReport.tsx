"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Clock,
  BarChart2, Users, ChevronDown, Activity, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EarningsEntry, EpsHistoryBatchResponse, EpsHistoryPoint } from "@/types/api";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EPS_HISTORY_CACHE_TTL_MS = 15 * 60 * 1000;
const EPS_HISTORY_CLIENT_CACHE = new Map<string, { data: EpsHistoryPoint[] | null; createdAt: number }>();

// ─── Formatters ────────────────────────────────────────────────────────────
const fmtEps = (v: number | null) => {
  if (v == null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}$${abs.toFixed(2)}`;
};

const fmtPrice = (v: number | null) => {
  if (v == null) return null;
  return v < 10 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`;
};

const fmtMarketCap = (v: number | null): string => {
  if (v == null) return "";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
};

const fmtVolume = (v: number | null): string => {
  if (v == null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
};

const fmtSurprise = (v: number | null) => {
  if (v == null) return null;
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
};

const fmtChange = (v: number | null) => {
  if (v == null) return null;
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
};

// ─── Sector colours ────────────────────────────────────────────────────────
const SECTOR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Technology":              { bg: "bg-blue-950",   text: "text-blue-300",   border: "border-blue-800" },
  "Healthcare":              { bg: "bg-teal-950",   text: "text-teal-300",   border: "border-teal-800" },
  "Financial Services":      { bg: "bg-indigo-950", text: "text-indigo-300", border: "border-indigo-800" },
  "Consumer Defensive":      { bg: "bg-emerald-950",text: "text-emerald-300",border: "border-emerald-800" },
  "Consumer Cyclical":       { bg: "bg-orange-950", text: "text-orange-300", border: "border-orange-800" },
  "Energy":                  { bg: "bg-amber-950",  text: "text-amber-300",  border: "border-amber-800" },
  "Industrials":             { bg: "bg-slate-800",  text: "text-slate-300",  border: "border-slate-600" },
  "Utilities":               { bg: "bg-purple-950", text: "text-purple-300", border: "border-purple-800" },
  "Real Estate":             { bg: "bg-rose-950",   text: "text-rose-300",   border: "border-rose-800" },
  "Communication Services":  { bg: "bg-sky-950",    text: "text-sky-300",    border: "border-sky-800" },
  "Basic Materials":         { bg: "bg-lime-950",   text: "text-lime-300",   border: "border-lime-800" },
};
const defaultSector = { bg: "bg-[var(--surface-3)]", text: "text-[var(--ink-muted)]", border: "border-[var(--line-soft)]" };
const getSectorColors = (sector: string | null) =>
  sector ? (SECTOR_COLORS[sector] ?? defaultSector) : defaultSector;

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  beat: {
    label: "BEAT", icon: TrendingUp,
    badge: "bg-[#1a3a1a] text-[#4ade80] border border-[#2d5c2d]",
    bar: "bg-[#4ade80]", iconCls: "text-[#4ade80]",
  },
  miss: {
    label: "MISS", icon: TrendingDown,
    badge: "bg-[#3a1a1a] text-[#f87171] border border-[#5c2d2d]",
    bar: "bg-[#f87171]", iconCls: "text-[#f87171]",
  },
  inline: {
    label: "IN-LINE", icon: Minus,
    badge: "bg-[#2a2a1a] text-[#fbbf24] border border-[#4a4a2d]",
    bar: "bg-[#fbbf24]", iconCls: "text-[#fbbf24]",
  },
  upcoming: {
    label: "UPCOMING", icon: Clock,
    badge: "bg-[var(--surface-3)] text-[var(--ink-muted)] border border-[var(--line-soft)]",
    bar: "bg-[var(--ink-muted)]", iconCls: "text-[var(--ink-muted)]",
  },
} as const;

const REPORT_TIME = {
  BMO: { label: "Before Open", color: "text-[#60a5fa]", border: "border-[#1e3a5c]", bg: "bg-[#0a1929]" },
  AMC: { label: "After Close",  color: "text-[#f59e0b]", border: "border-[#5c3b00]", bg: "bg-[#1a0f00]" },
  TNS: { label: "Time N/A",     color: "text-[var(--ink-muted)]", border: "border-[var(--line-soft)]", bg: "bg-[var(--surface-3)]" },
};

const STATUS_COLORS: Record<EpsHistoryPoint["status"], string> = {
  beat: "#4ade80", miss: "#f87171", inline: "#fbbf24", upcoming: "#6b7280",
};

// ─── EPS Sparkline ─────────────────────────────────────────────────────────
function EpsSparkline({ points, loading }: { points: EpsHistoryPoint[] | null; loading: boolean }) {
  if (loading) return <div className="mt-2 h-[62px] w-full animate-pulse rounded bg-[var(--surface-3)]" />;
  if (!points || points.length < 2) return null;

  const W = 260; const H = 52; const PAD_X = 16;
  const CHART_TOP = 6; const CHART_BOTTOM = 36; const LABEL_Y = 48; const BAR_W = 24;
  const chartH = CHART_BOTTOM - CHART_TOP;
  const epsValues = points.map((p) => p.epsActual ?? p.epsEstimate ?? 0);
  const maxAbs = Math.max(...epsValues.map(Math.abs), 0.01);
  const n = points.length;
  const slotW = (W - PAD_X * 2) / n;
  const xCenter = (i: number) => PAD_X + slotW * i + slotW / 2;
  const ZERO_Y = CHART_TOP + chartH / 2;
  const barY = (eps: number) => {
    const ratio = Math.min(Math.abs(eps) / maxAbs, 1);
    const px = Math.max(ratio * (chartH / 2 - 2), 2);
    return eps >= 0 ? ZERO_Y - px : ZERO_Y;
  };
  const barH = (eps: number) => Math.max(Math.min(Math.abs(eps) / maxAbs, 1) * (chartH / 2 - 2), 2);
  const dotY = (eps: number) => (eps >= 0 ? barY(eps) : barY(eps) + barH(eps));
  const linePts = points.map((p, i) => `${xCenter(i)},${dotY(p.epsActual ?? p.epsEstimate ?? 0)}`).join(" ");

  return (
    <div className="mt-2.5 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 pt-1 pb-0.5">
      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
        EPS History · Last {points.length} Quarters
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
        <line x1={PAD_X - 4} y1={ZERO_Y} x2={W - PAD_X + 4} y2={ZERO_Y} stroke="rgba(255,255,255,0.12)" strokeWidth={0.75} strokeDasharray="3 2" />
        {points.map((p, i) => {
          const eps = p.epsActual ?? p.epsEstimate ?? 0;
          const color = STATUS_COLORS[p.status];
          const bx = xCenter(i) - BAR_W / 2;
          const by = barY(eps); const bh = barH(eps);
          const isEst = p.epsActual == null;
          return (
            <g key={p.quarter}>
              <rect x={bx} y={by} width={BAR_W} height={bh} rx={2} fill={color} fillOpacity={isEst ? 0.3 : 0.75} stroke={color} strokeWidth={0.5} strokeOpacity={0.6} />
              {isEst && <rect x={bx} y={by} width={BAR_W} height={bh} rx={2} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2 2" />}
              <text x={xCenter(i)} y={eps >= 0 ? by - 2 : by + bh + 8} textAnchor="middle" fontSize={7} fill={color} fontWeight="700">{fmtEps(eps)}</text>
            </g>
          );
        })}
        <polyline points={linePts} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} strokeLinejoin="round" />
        {points.map((p, i) => {
          const eps = p.epsActual ?? p.epsEstimate ?? 0;
          return <circle key={`dot-${p.quarter}`} cx={xCenter(i)} cy={dotY(eps)} r={2.5} fill={STATUS_COLORS[p.status]} stroke="var(--surface-1)" strokeWidth={1} />;
        })}
        {points.map((p, i) => (
          <text key={`lbl-${p.quarter}`} x={xCenter(i)} y={LABEL_Y} textAnchor="middle" fontSize={7.5} fill="rgba(255,255,255,0.38)" fontWeight="600">{p.quarter}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Beat-Rate Banner ──────────────────────────────────────────────────────
function BeatRateBanner({ entries }: { entries: EarningsEntry[] }) {
  const reported = entries.filter((e) => e.status !== "upcoming");
  if (reported.length === 0) return null;

  const beats = reported.filter((e) => e.status === "beat").length;
  const misses = reported.filter((e) => e.status === "miss").length;
  const inline = reported.filter((e) => e.status === "inline").length;
  const pct = Math.round((beats / reported.length) * 100);

  const color   = pct >= 65 ? "#4ade80" : pct >= 45 ? "#fbbf24" : "#f87171";
  const bgGlow  = pct >= 65 ? "rgba(74,222,128,0.07)" : pct >= 45 ? "rgba(251,191,36,0.07)" : "rgba(248,113,113,0.07)";
  const label   = pct >= 65 ? "Strong Beat Season" : pct >= 45 ? "Mixed Results" : "Weak Beat Season";

  return (
    <div
      className="border-b border-[var(--line-soft)] px-4 py-2.5"
      style={{ background: `linear-gradient(90deg, ${bgGlow}, transparent 60%)` }}
    >
      <div className="flex items-center gap-3">
        {/* Big beat-rate number */}
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="text-2xl font-black tabular-nums leading-none" style={{ color }}>
            {pct}%
          </span>
          <span className="text-[10px] font-semibold text-[var(--ink-muted)]">beat</span>
        </div>

        {/* Progress bar + label */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
            <span className="text-[9px] text-[var(--ink-muted)]">
              {reported.length} of {entries.length} reported
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}55` }}
            />
          </div>
        </div>

        {/* Pill counts */}
        <div className="flex shrink-0 items-center gap-1.5">
          {beats > 0 && (
            <span className="rounded bg-[#1a3a1a] border border-[#2d5c2d] px-1.5 py-0.5 text-[9px] font-bold text-[#4ade80]">
              ▲{beats}
            </span>
          )}
          {inline > 0 && (
            <span className="rounded bg-[#2a2a1a] border border-[#4a4a2d] px-1.5 py-0.5 text-[9px] font-bold text-[#fbbf24]">
              ={inline}
            </span>
          )}
          {misses > 0 && (
            <span className="rounded bg-[#3a1a1a] border border-[#5c2d2d] px-1.5 py-0.5 text-[9px] font-bold text-[#f87171]">
              ▼{misses}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 52-Week Range Bar ─────────────────────────────────────────────────────
function FiftyTwoWeekBar({ price, low, high }: { price: number; low: number; high: number }) {
  const range = high - low;
  if (range <= 0) return null;
  const pct = Math.min(100, Math.max(0, ((price - low) / range) * 100));
  const nearHigh = pct >= 80;
  const nearLow  = pct <= 20;
  const barColor = nearHigh ? "#4ade80" : nearLow ? "#f87171" : "#60a5fa";

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-[8px] font-mono text-[var(--ink-muted)]">{low < 10 ? low.toFixed(3) : low.toFixed(2)}</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
          {/* Cursor marker */}
          <div
            className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-sm bg-white"
            style={{ left: `calc(${pct}% - 1px)`, opacity: 0.85 }}
          />
        </div>
        <span className="shrink-0 text-[8px] font-mono text-[var(--ink-muted)]">{high < 10 ? high.toFixed(3) : high.toFixed(2)}</span>
      </div>
      <p className="mt-0.5 text-center text-[7.5px] text-[var(--ink-muted)]">52-Week Range</p>
    </div>
  );
}

// ─── Earnings Card ─────────────────────────────────────────────────────────
function EarningsCard({
  entry,
  epsPoints,
  epsLoading,
}: {
  entry: EarningsEntry;
  epsPoints: EpsHistoryPoint[] | null;
  epsLoading: boolean;
}) {
  const cfg = STATUS_CONFIG[entry.status];
  const Icon = cfg.icon;
  const rtInfo = REPORT_TIME[entry.reportTime] ?? REPORT_TIME.TNS;
  const sectorCls = getSectorColors(entry.sector);
  const surpriseStr = fmtSurprise(entry.epsSurprisePct);
  const changeStr = fmtChange(entry.changePercent);
  const priceStr = fmtPrice(entry.price);
  const volRatio = entry.volume != null && entry.avgVolume != null && entry.avgVolume > 0
    ? entry.volume / entry.avgVolume : null;

  return (
    <article className="relative border-b border-[var(--line-soft)] py-3 pl-[18px] pr-3 hover:bg-[var(--surface-3)] transition-colors sm:pr-4">
      {/* Left status accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r", cfg.bar)} />

      {/* ── Row 1: Ticker + Company + Sector + Badges ── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Ticker block */}
          <div className="flex h-10 min-w-[42px] shrink-0 flex-col items-center justify-center rounded-md bg-[var(--surface-1)] border border-[var(--line-soft)] px-1.5">
            <span className="text-[9px] font-black tracking-tight text-[var(--ink-primary)] leading-tight">
              {entry.symbol.length > 5 ? entry.symbol.slice(0, 4) + "…" : entry.symbol}
            </span>
            <span className={cn("text-[7px] font-bold uppercase", rtInfo.color)}>{entry.reportTime}</span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[13px] font-extrabold tracking-tight text-[var(--ink-primary)]">
                {entry.symbol}
              </span>
              {/* Sector chip */}
              {entry.sector && (
                <span className={cn("hidden sm:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[8px] font-semibold", sectorCls.bg, sectorCls.text, sectorCls.border)}>
                  <Building2 size={7} />
                  {entry.sector}
                </span>
              )}
              {/* Fiscal quarter */}
              {entry.fiscalQuarterEnding && (
                <span className="rounded bg-[var(--surface-3)] border border-[var(--line-soft)] px-1 py-0.5 text-[8px] text-[var(--ink-muted)]">
                  {entry.fiscalQuarterEnding}
                </span>
              )}
            </div>
            <p className="truncate text-[10px] text-[var(--ink-muted)] mt-0.5 max-w-[180px] sm:max-w-[260px]">
              {entry.shortName}
              {entry.industry && entry.industry !== entry.sector ? ` · ${entry.industry}` : ""}
            </p>
          </div>
        </div>

        {/* Right badges */}
        <div className="flex shrink-0 items-center gap-1.5">
          {entry.marketCap != null && (
            <span className="hidden sm:inline text-[9px] text-[var(--ink-muted)]">{fmtMarketCap(entry.marketCap)}</span>
          )}
          <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider", cfg.badge)}>
            <Icon size={8} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Row 2: Price + Change + 52W Bar ── */}
      {priceStr && (
        <div className="mt-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-black tabular-nums leading-none text-[var(--ink-primary)]">
                {priceStr}
              </span>
              {changeStr && (
                <span className={cn("text-[12px] font-bold tabular-nums",
                  entry.changePercent! > 0 ? "text-[#4ade80]"
                  : entry.changePercent! < 0 ? "text-[#f87171]"
                  : "text-[var(--ink-muted)]"
                )}>
                  {entry.changePercent! > 0 ? "▲" : entry.changePercent! < 0 ? "▼" : ""} {changeStr}
                </span>
              )}
            </div>
            {/* Report time badge */}
            <span className={cn("ml-auto hidden sm:inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
              rtInfo.bg, rtInfo.color, rtInfo.border)}>
              {rtInfo.label}
            </span>
          </div>
          {/* 52W range bar */}
          {entry.fiftyTwoWeekHigh != null && entry.fiftyTwoWeekLow != null && entry.price != null && (
            <FiftyTwoWeekBar price={entry.price} low={entry.fiftyTwoWeekLow} high={entry.fiftyTwoWeekHigh} />
          )}
        </div>
      )}

      {/* ── Row 3: EPS data grid ── */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* EPS Estimate */}
        <div className="rounded-md bg-[var(--surface-1)] border border-[var(--line-soft)] p-2">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">EPS Estimate</p>
          <p className="mt-0.5 text-[13px] font-bold text-[var(--ink-primary)]">{fmtEps(entry.epsEstimate)}</p>
          {entry.noOfEsts != null && (
            <p className="mt-0.5 flex items-center gap-0.5 text-[8px] text-[var(--ink-muted)]">
              <Users size={7} /> {entry.noOfEsts} analyst{entry.noOfEsts !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* EPS Actual or Last Year */}
        <div className={cn("rounded-md border p-2",
          entry.epsActual != null
            ? entry.status === "beat" ? "bg-[#1a3a1a] border-[#2d5c2d]"
              : entry.status === "miss" ? "bg-[#3a1a1a] border-[#5c2d2d]"
              : "bg-[var(--surface-1)] border-[var(--line-soft)]"
            : "bg-[var(--surface-1)] border-[var(--line-soft)]"
        )}>
          <p className="text-[8px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            {entry.epsActual != null ? "EPS Actual" : "Last Year EPS"}
          </p>
          <p className={cn("mt-0.5 text-[13px] font-bold",
            entry.epsActual != null
              ? entry.status === "beat" ? "text-[#4ade80]"
                : entry.status === "miss" ? "text-[#f87171]"
                : "text-[var(--ink-primary)]"
              : "text-[var(--ink-muted)]"
          )}>
            {entry.epsActual != null ? fmtEps(entry.epsActual) : fmtEps(entry.lastYearEPS)}
          </p>
          {entry.epsActual == null && entry.lastYearEPS != null && (
            <p className="mt-0.5 text-[8px] text-[var(--ink-muted)]">YoY reference</p>
          )}
        </div>

        {/* EPS Surprise */}
        <div className="rounded-md bg-[var(--surface-1)] border border-[var(--line-soft)] p-2">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Surprise</p>
          <p className={cn("mt-0.5 text-[13px] font-bold",
            surpriseStr == null ? "text-[var(--ink-muted)]"
            : entry.epsSurprisePct! > 0 ? "text-[#4ade80]"
            : entry.epsSurprisePct! < 0 ? "text-[#f87171]"
            : "text-[#fbbf24]"
          )}>
            {surpriseStr ?? "Pending"}
          </p>
          {surpriseStr && (
            <p className="mt-0.5 text-[8px] text-[var(--ink-muted)]">
              {entry.epsSurprisePct! > 0 ? "Exceeded" : "Missed"} by {Math.abs(entry.epsSurprisePct!).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Report Time */}
        <div className="rounded-md bg-[var(--surface-1)] border border-[var(--line-soft)] p-2">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Report Time</p>
          <p className={cn("mt-0.5 text-[11px] font-black", rtInfo.color)}>{entry.reportTime}</p>
          <p className="mt-0.5 text-[8px] text-[var(--ink-muted)]">{rtInfo.label}</p>
        </div>
      </div>

      {/* ── Row 4: Fundamentals strip ── */}
      {(entry.epsTrailingTwelveMonths != null || entry.trailingPE != null || entry.forwardPE != null || entry.volume != null) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-1.5">
          <Activity size={9} className="shrink-0 text-[var(--ink-muted)]" />
          {entry.epsTrailingTwelveMonths != null && (
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">TTM EPS</span>
              <span className="text-[10px] font-bold text-[var(--ink-primary)]">{fmtEps(entry.epsTrailingTwelveMonths)}</span>
            </div>
          )}
          {entry.trailingPE != null && (
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">P/E</span>
              <span className="text-[10px] font-bold text-[var(--ink-primary)]">{entry.trailingPE.toFixed(1)}×</span>
            </div>
          )}
          {entry.forwardPE != null && (
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">Fwd P/E</span>
              <span className="text-[10px] font-bold text-[var(--ink-primary)]">{entry.forwardPE.toFixed(1)}×</span>
            </div>
          )}
          {entry.volume != null && (
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[var(--ink-muted)] uppercase tracking-wide">Vol</span>
              <span className={cn("text-[10px] font-bold",
                volRatio != null && volRatio >= 1.5 ? "text-[#f59e0b]"
                : volRatio != null && volRatio >= 2.0 ? "text-[#f87171]"
                : "text-[var(--ink-primary)]"
              )}>
                {fmtVolume(entry.volume)}
                {volRatio != null && (
                  <span className="ml-0.5 text-[8px] font-normal text-[var(--ink-muted)]">
                    ({volRatio.toFixed(1)}× avg)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Row 5: EPS Sparkline ── */}
      <EpsSparkline points={epsPoints} loading={epsLoading} />
    </article>
  );
}

// ─── Tab config ─────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",  label: "All" },
  { key: "bmo",  label: "Pre-Market" },
  { key: "amc",  label: "After-Hours" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── Main EarningsReport ────────────────────────────────────────────────────
export default function EarningsReport() {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [isOpen, setIsOpen] = useState(true);
  const [epsBySymbol, setEpsBySymbol] = useState<Record<string, EpsHistoryPoint[] | null>>({});
  const [epsLoading, setEpsLoading] = useState(false);

  const fetchEarnings = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/earnings");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as EarningsEntry[];
      setEntries(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch { setError(true); }
    finally { if (isInitial) setLoading(false); }
  }, []);

  useEffect(() => {
    void fetchEarnings(true);
    const id = setInterval(() => void fetchEarnings(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchEarnings]);

  useEffect(() => {
    const symbols = Array.from(new Set(entries.map((entry) => entry.symbol.toUpperCase().trim()).filter(Boolean)));
    if (symbols.length === 0) {
      setEpsBySymbol({});
      return;
    }

    const now = Date.now();
    const fromCache: Record<string, EpsHistoryPoint[] | null> = {};
    const missing: string[] = [];

    for (const symbol of symbols) {
      const cached = EPS_HISTORY_CLIENT_CACHE.get(symbol);
      if (cached && now - cached.createdAt < EPS_HISTORY_CACHE_TTL_MS) {
        fromCache[symbol] = cached.data;
      } else {
        missing.push(symbol);
      }
    }

    setEpsBySymbol((prev) => ({ ...prev, ...fromCache }));
    if (missing.length === 0) return;

    let cancelled = false;
    setEpsLoading(true);

    void (async () => {
      try {
        const params = new URLSearchParams();
        for (const symbol of missing) params.append("symbol", symbol);
        const res = await fetch(`/api/earnings/history?${params.toString()}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = (await res.json()) as EpsHistoryBatchResponse;
        if (cancelled) return;

        const fresh: Record<string, EpsHistoryPoint[] | null> = {};
        for (const symbol of missing) {
          const points = data[symbol];
          const normalized = Array.isArray(points) && points.length > 0 ? points : null;
          fresh[symbol] = normalized;
          EPS_HISTORY_CLIENT_CACHE.set(symbol, { data: normalized, createdAt: Date.now() });
        }
        setEpsBySymbol((prev) => ({ ...prev, ...fresh }));
      } catch {
        if (cancelled) return;
        const fallback: Record<string, EpsHistoryPoint[] | null> = {};
        for (const symbol of missing) fallback[symbol] = null;
        setEpsBySymbol((prev) => ({ ...prev, ...fallback }));
      } finally {
        if (!cancelled) setEpsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  const filtered = entries.filter((e) =>
    activeTab === "bmo" ? e.reportTime === "BMO"
    : activeTab === "amc" ? e.reportTime === "AMC"
    : true
  );

  const beatsCount  = entries.filter((e) => e.status === "beat").length;
  const missesCount = entries.filter((e) => e.status === "miss").length;
  const bmoCount    = entries.filter((e) => e.reportTime === "BMO").length;
  const amcCount    = entries.filter((e) => e.reportTime === "AMC").length;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <section className="ff-panel flex h-full min-h-0 flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2 sm:px-4">
        {/* Left: toggle */}
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          aria-controls="earnings-body"
          className="flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity hover:opacity-80"
        >
          <BarChart2 size={14} className="shrink-0 text-[var(--ink-primary)]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Earnings Report</h2>
              <ChevronDown size={12} className={cn(
                "shrink-0 text-[var(--ink-muted)] transition-transform duration-300 ease-in-out",
                isOpen ? "rotate-0" : "-rotate-90"
              )} />
            </div>
            {isOpen ? (
              <p className="text-[11px] text-[var(--ink-muted)]">{todayLabel} · Real-time Results &amp; Estimates</p>
            ) : (
              <p className="truncate text-[11px] text-[var(--ink-muted)]">
                {loading ? "Loading…"
                  : entries.length === 0 ? `${todayLabel} · No data`
                  : [todayLabel, `${entries.length} co.`, beatsCount > 0 ? `▲${beatsCount} beat` : null, missesCount > 0 ? `▼${missesCount} miss` : null].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </button>

        {/* Right: pills + refresh */}
        <div className="flex shrink-0 items-center gap-2">
          {isOpen && !loading && entries.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {beatsCount > 0 && <span className="rounded bg-[#1a3a1a] border border-[#2d5c2d] px-2 py-0.5 text-[10px] font-bold text-[#4ade80]">▲ {beatsCount} Beat</span>}
              {missesCount > 0 && <span className="rounded bg-[#3a1a1a] border border-[#5c2d2d] px-2 py-0.5 text-[10px] font-bold text-[#f87171]">▼ {missesCount} Miss</span>}
              <span className="rounded bg-[var(--surface-3)] border border-[var(--line-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)]">{entries.length} total</span>
            </div>
          )}
          {lastUpdated && isOpen && (
            <span className="hidden sm:inline text-[10px] text-[var(--ink-muted)]">
              {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => void fetchEarnings(false)}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-primary)] hover:bg-[var(--surface-3)] transition-colors"
            aria-label="Refresh earnings"
          >
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* ── Collapsible body ── */}
      <div
        id="earnings-body"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        className="grid min-h-0 flex-1 transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="flex min-h-0 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--line-strong)] bg-[var(--surface-1)]">
            {TABS.map((tab) => {
              const count = tab.key === "bmo" ? bmoCount : tab.key === "amc" ? amcCount : entries.length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1 border-b-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                    activeTab === tab.key
                      ? "border-[var(--ink-primary)] text-[var(--ink-primary)]"
                      : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                  )}
                >
                  {tab.label}
                  {count > 0 && !loading && <span className="text-[9px] opacity-50">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Beat-rate banner — shows only when there are reported results */}
          {!loading && !error && <BeatRateBanner entries={filtered} />}

          {/* Card list */}
          <div className="ff-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--surface-2)]">
            {loading ? (
              <div className="flex flex-col gap-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b border-[var(--line-soft)] py-3 pl-[18px] pr-4 animate-pulse">
                    <div className="flex gap-2.5">
                      <div className="h-10 w-10 rounded-md bg-[var(--surface-3)]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-20 rounded bg-[var(--surface-3)]" />
                        <div className="h-2.5 w-32 rounded bg-[var(--surface-3)]" />
                      </div>
                    </div>
                    <div className="mt-2 h-[52px] rounded-md bg-[var(--surface-3)]" />
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-14 rounded-md bg-[var(--surface-3)]" />
                      ))}
                    </div>
                    <div className="mt-2 h-8 rounded-md bg-[var(--surface-3)]" />
                    <div className="mt-2 h-[62px] rounded bg-[var(--surface-3)]" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <BarChart2 size={20} className="text-[var(--ink-muted)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--ink-muted)]">Could not load earnings data</p>
                <p className="text-xs text-[var(--ink-muted)] opacity-60">Markets may be closed or data is temporarily unavailable</p>
                <button type="button" onClick={() => void fetchEarnings(true)}
                  className="mt-1 rounded border border-[var(--line-soft)] bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-1)] transition-colors">
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
                <Clock size={20} className="text-[var(--ink-muted)] opacity-40" />
                <p className="text-sm text-[var(--ink-muted)]">
                  {activeTab === "bmo" ? "No pre-market earnings today"
                   : activeTab === "amc" ? "No after-hours earnings today"
                   : "No earnings scheduled for today"}
                </p>
              </div>
            ) : (
              filtered.map((entry) => {
                const symbol = entry.symbol.toUpperCase().trim();
                const points = epsBySymbol[symbol] ?? null;
                const isPointsLoading = epsLoading && points == null;
                return <EarningsCard key={entry.id} entry={entry} epsPoints={points} epsLoading={isPointsLoading} />;
              })
            )}
          </div>

          {/* Footer */}
          {!loading && !error && entries.length > 0 && (
            <div className="border-t border-[var(--line-soft)] bg-[var(--surface-1)] px-4 py-1.5">
              <p className="text-[10px] text-[var(--ink-muted)]">
                Data via Nasdaq · EPS history & fundamentals via Yahoo Finance · Auto-refreshes every 5 min
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
