"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Flag,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

type DashboardSummary = {
  totalUsers: number;
  verifiedAnalysts: number;
  activeInvites: number;
  openComplaints: number;
};

type GrowthBar = {
  month: string;
  users: number;
};

type ActivityItem = {
  id: string;
  message: string;
  createdAt: string;
  color: string;
  type: string;
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  border,
  href,
  loading,
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  color: string;
  bg: string;
  border: string;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border p-4 transition-colors hover:brightness-110"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
          {label}
        </p>
        <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <ArrowUpRight size={12} style={{ color }} />
        </div>
      </div>
      <p className="mt-3 font-rajdhani text-4xl font-bold" style={{ color: "var(--ink-primary)" }}>
        {loading ? (
          <span className="inline-block h-8 w-12 animate-pulse rounded bg-[var(--surface-hover)]" />
        ) : (
          value
        )}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] uppercase tracking-wide" style={{ color }}>
          View all
        </span>
      </div>
    </Link>
  );
}

const formatRelativeTime = (iso: string) => {
  const value = new Date(iso).getTime();
  const diff = Date.now() - value;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hrs ago`;
  return new Date(iso).toLocaleDateString();
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalUsers: 0,
    verifiedAnalysts: 0,
    activeInvites: 0,
    openComplaints: 0,
  });
  const [growth, setGrowth] = useState<GrowthBar[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const dashboardRes = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (dashboardRes.ok) {
          const d = (await dashboardRes.json()) as {
            summary: DashboardSummary;
            growth: GrowthBar[];
            recentActivity: ActivityItem[];
          };
          setSummary(d.summary);
          setGrowth(d.growth ?? []);
          setActivity(d.recentActivity ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const maxBar = Math.max(1, ...growth.map((b) => b.users));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Platform overview · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={summary.totalUsers}
          icon={Users}
          color="#1d9bf0"
          bg="#1d9bf015"
          border="#1d9bf044"
          href="/admin/users"
          loading={loading}
        />
        <StatCard
          label="Verified Analysts"
          value={summary.verifiedAnalysts}
          icon={BadgeCheck}
          color="#2ecf87"
          bg="#2ecf8715"
          border="#2ecf8744"
          href="/admin/users"
          loading={loading}
        />
        <StatCard
          label="Active Invites"
          value={summary.activeInvites}
          icon={Ticket}
          color="#ffb347"
          bg="#ffb34715"
          border="#ffb34744"
          href="/admin/invites"
          loading={loading}
        />
        <StatCard
          label="Open Complaints"
          value={summary.openComplaints}
          icon={Flag}
          color="#ff4b55"
          bg="#ff4b5515"
          border="#ff4b5544"
          href="/admin/complaints"
          loading={loading}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Growth chart */}
        <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#1d9bf0]" />
              <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">User Growth (6 Months)</h2>
            </div>
            <span className="text-[10px] text-[var(--ink-muted)]">Cumulative registrations</span>
          </div>
          <div className="p-4">
            {growth.length === 0 && !loading && (
              <p className="text-xs text-[var(--ink-muted)]">No growth data yet.</p>
            )}
            {growth.length > 0 && (
              <div className="space-y-3">
                <div className="h-36 w-full">
                  <svg viewBox="0 0 600 160" className="h-full w-full" aria-hidden="true">
                    <defs>
                      <linearGradient id="growthLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d9bf0" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#1d9bf0" stopOpacity="0.25" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="600" height="160" fill="transparent" />
                    {(() => {
                      const width = 600;
                      const height = 160;
                      const pad = 14;
                      const innerW = width - pad * 2;
                      const innerH = height - pad * 2;
                      const points = growth.map((bar, index) => {
                        const x = pad + (growth.length === 1 ? 0 : (index / (growth.length - 1)) * innerW);
                        const y = height - pad - (bar.users / maxBar) * innerH;
                        return `${x},${y}`;
                      });
                      const line = points.join(" ");
                      const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
                      return (
                        <>
                          <polyline
                            points={area}
                            fill="url(#growthLine)"
                            stroke="none"
                          />
                          <polyline
                            points={line}
                            fill="none"
                            stroke="#1d9bf0"
                            strokeWidth="2"
                          />
                          {points.map((point, i) => {
                            const [x, y] = point.split(",").map(Number);
                            return (
                              <circle key={growth[i].month} cx={x} cy={y} r="3" fill="#1d9bf0" />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {growth.map((bar) => (
                    <div key={`label-${bar.month}`} className="flex items-center justify-center gap-2 text-[10px] text-[var(--ink-muted)]">
                      <span className="font-semibold text-[var(--ink-primary)]">{bar.users}</span>
                      <span>{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#ffb347]" />
              <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Recent Activity</h2>
            </div>
          </div>
          <div className="divide-y divide-[var(--line-soft)]">
            {activity.length === 0 && !loading && (
              <div className="px-4 py-6 text-center text-xs text-[var(--ink-muted)]">No recent activity yet.</div>
            )}
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--ink-primary)]">{item.message}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {[
            { label: "Create Invite", href: "/admin/invites", icon: Ticket, color: "#ffb347" },
            { label: "Manage Users", href: "/admin/users", icon: Users, color: "#1d9bf0" },
            { label: "View Reports", href: "/admin/complaints", icon: Flag, color: "#ff4b55" },
            { label: "Broadcast", href: "/admin/notifications", icon: Bell, color: "#2ecf87" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-4 text-center transition-colors hover:bg-[var(--surface-hover)]"
            >
              <action.icon size={20} style={{ color: action.color }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
