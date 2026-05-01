"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, BarChart3, TrendingDown, TrendingUp, Users } from "lucide-react";

type TeamMember = {
  id: string;
  role: "user" | "analyst" | "admin";
  isVerifiedAnalyst: boolean;
  isActive: boolean;
  xp: number;
  createdAt: string;
};

type InviteCode = {
  code: string;
  used_count: number;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
};

type MonthlyDatum = {
  month: string;
  users: number;
  invitesUsed: number;
  complaints: number;
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex h-20 flex-col items-center justify-end gap-1">
      <span className="text-[10px] font-semibold text-[var(--ink-primary)]">{value}</span>
      <div
        className="w-full rounded-t"
        style={{
          height: `${Math.max((value / max) * 100, 6)}%`,
          background: `linear-gradient(180deg, ${color} 0%, ${color}44 100%)`,
        }}
      />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [monthly, setMonthly] = useState<MonthlyDatum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [teamRes, inviteRes, analyticsRes] = await Promise.all([
          fetch("/api/admin/team", { cache: "no-store" }),
          fetch("/api/admin/invite-codes", { cache: "no-store" }),
          fetch("/api/admin/analytics", { cache: "no-store" }),
        ]);
        if (teamRes.ok) {
          const d = (await teamRes.json()) as { team: TeamMember[] };
          setMembers(d.team ?? []);
        }
        if (inviteRes.ok) {
          const d = (await inviteRes.json()) as { inviteCodes: InviteCode[] };
          setInvites(d.inviteCodes ?? []);
        }
        if (analyticsRes.ok) {
          const d = (await analyticsRes.json()) as { monthly: MonthlyDatum[] };
          setMonthly(d.monthly ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalInviteUses = invites.reduce((sum, c) => sum + c.used_count, 0);
  const activeUsers = members.filter((m) => m.isActive).length;
  const analysts = members.filter((m) => m.isVerifiedAnalyst).length;
  const avgXp = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.xp, 0) / members.length) : 0;

  const maxUsers = Math.max(1, ...monthly.map((d) => d.users));
  const maxInvites = Math.max(1, ...monthly.map((d) => d.invitesUsed));
  const maxComplaints = Math.max(1, ...monthly.map((d) => d.complaints));

  const roleBreakdown = [
    { label: "Users", count: members.filter((m) => m.role === "user").length, color: "#1d9bf0" },
    { label: "Analysts", count: analysts, color: "#2ecf87" },
    { label: "Admins", count: members.filter((m) => m.role === "admin").length, color: "#ff4b55" },
  ];
  const totalForPie = members.length || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Platform growth, engagement metrics, and user composition.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Users", value: loading ? "—" : members.length, icon: Users, color: "#1d9bf0" },
          { label: "Active Users", value: loading ? "—" : activeUsers, icon: TrendingUp, color: "#2ecf87" },
          { label: "Analyst Ratio", value: loading ? "—" : `${members.length ? Math.round((analysts / members.length) * 100) : 0}%`, icon: BadgeCheck, color: "#ffb347" },
          { label: "Avg XP", value: loading ? "—" : avgXp.toLocaleString(), icon: BarChart3, color: "#9b7fef" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] p-4"
          >
            <div className="flex items-center gap-2">
              <kpi.icon size={13} style={{ color: kpi.color }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">{kpi.label}</p>
            </div>
            <p className="mt-2 font-rajdhani text-3xl font-bold text-[var(--ink-primary)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* User growth bar chart */}
        <div className="xl:col-span-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
            <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Cumulative Users / 6 Months</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-2">
              {monthly.length === 0 && !loading && (
                <p className="col-span-6 text-center text-xs text-[var(--ink-muted)]">No growth data yet.</p>
              )}
              {monthly.map((d) => (
                <div key={d.month} className="flex flex-col items-center gap-1.5">
                  <MiniBar value={d.users} max={maxUsers} color="#1d9bf0" />
                  <span className="text-[10px] text-[var(--ink-muted)]">{d.month}</span>
                </div>
              ))}
            </div>
            {/* Multi-series legend */}
            <div className="mt-4 grid grid-cols-6 gap-2 border-t border-[var(--line-soft)] pt-3">
              {monthly.map((d) => (
                <div key={`inv-${d.month}`} className="flex flex-col items-center gap-1.5">
                  <MiniBar value={d.invitesUsed} max={maxInvites} color="#ffb347" />
                  <span className="text-[10px] text-[var(--ink-muted)]">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--ink-muted)]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1d9bf0] inline-block" /> Cumulative Users</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ffb347] inline-block" /> Invite Redemptions</span>
            </div>
          </div>
        </div>

        {/* Role breakdown */}
        <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
            <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">User Role Breakdown</h2>
          </div>
          <div className="p-4 space-y-3">
            {roleBreakdown.map((role) => (
              <div key={role.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--ink-primary)]">{role.label}</span>
                  <span className="text-xs text-[var(--ink-muted)]">{role.count} ({Math.round((role.count / totalForPie) * 100)}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(role.count / totalForPie) * 100}%`,
                      background: role.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Complaints trend */}
          <div className="border-t border-[var(--line-strong)] p-4">
            <p className="ff-panel-title text-xs text-[var(--ink-primary)] mb-3">Monthly Complaints</p>
            <div className="grid grid-cols-6 gap-1">
              {monthly.map((d) => (
                <div key={`comp-${d.month}`} className="flex flex-col items-center gap-1">
                  <MiniBar value={d.complaints} max={maxComplaints} color="#ff4b55" />
                  <span className="text-[9px] text-[var(--ink-muted)]">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite utilisation */}
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg flex items-center justify-between">
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Invite Code Utilisation</h2>
          <span className="text-[10px] text-[var(--ink-muted)]">Total redemptions: {totalInviteUses}</span>
        </div>
        <div className="divide-y divide-[var(--line-soft)]">
          {invites.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-[var(--ink-muted)]">No invite codes yet.</p>
          )}
          {invites.map((inv) => {
            const denom = inv.max_uses ?? Math.max(inv.used_count, 1);
            const pct = Math.min(100, denom > 0 ? (inv.used_count / denom) * 100 : 0);
            return (
              <div key={inv.code} className="flex items-center gap-4 px-4 py-3">
                <span className="font-mono text-xs font-semibold text-[var(--ink-primary)] w-32 shrink-0">{inv.code}</span>
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div className="h-full rounded-full bg-[#ffb347]" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-[var(--ink-muted)] shrink-0">{inv.used_count} uses</span>
                {inv.is_active
                  ? <span className="text-[10px] text-[#5de6a7] flex items-center gap-1"><TrendingUp size={9} /> Active</span>
                  : <span className="text-[10px] text-[var(--ink-muted)] flex items-center gap-1"><TrendingDown size={9} /> Inactive</span>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
