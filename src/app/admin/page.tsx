"use client";

import { useEffect, useState } from "react";
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

type TeamMember = {
  id: string;
  displayName: string;
  role: "user" | "analyst" | "admin";
  isVerifiedAnalyst: boolean;
  isActive: boolean;
  xp: number;
  createdAt: string;
};

type InviteCode = {
  code: string;
  invite_type: "analyst" | "admin";
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

const STAT_CARD_CONFIGS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    color: "#1d9bf0",
    bg: "#1d9bf015",
    border: "#1d9bf044",
    href: "/admin/users",
  },
  {
    key: "verifiedAnalysts",
    label: "Verified Analysts",
    icon: BadgeCheck,
    color: "#2ecf87",
    bg: "#2ecf8715",
    border: "#2ecf8744",
    href: "/admin/users",
  },
  {
    key: "activeInvites",
    label: "Active Invites",
    icon: Ticket,
    color: "#ffb347",
    bg: "#ffb34715",
    border: "#ffb34744",
    href: "/admin/invites",
  },
  {
    key: "openComplaints",
    label: "Open Complaints",
    icon: Flag,
    color: "#ff4b55",
    bg: "#ff4b5515",
    border: "#ff4b5544",
    href: "/admin/complaints",
  },
];

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
  icon: React.ElementType;
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

const RECENT_ACTIVITY_MOCK = [
  { id: 1, type: "invite_used", message: "Invite code TMS-XK9 was redeemed by a new analyst", time: "2 mins ago", color: "#2ecf87" },
  { id: 2, type: "complaint", message: "New forum complaint filed: Spam post in #FX Analysis", time: "14 mins ago", color: "#ff4b55" },
  { id: 3, type: "user_join", message: "New user registered via analyst invite", time: "1 hr ago", color: "#1d9bf0" },
  { id: 4, type: "invite_used", message: "Invite code TMS-W2R was redeemed", time: "3 hrs ago", color: "#2ecf87" },
  { id: 5, type: "complaint", message: "Forum complaint resolved: Inappropriate language", time: "5 hrs ago", color: "#ffb347" },
  { id: 6, type: "user_join", message: "New analyst profile verified: @macro_hawk", time: "Yesterday", color: "#1d9bf0" },
];

const GROWTH_BARS = [
  { month: "Nov", users: 4 },
  { month: "Dec", users: 9 },
  { month: "Jan", users: 15 },
  { month: "Feb", users: 23 },
  { month: "Mar", users: 31 },
  { month: "Apr", users: 38 },
];

export default function AdminDashboardPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [teamRes, inviteRes] = await Promise.all([
          fetch("/api/admin/team", { cache: "no-store" }),
          fetch("/api/admin/invite-codes", { cache: "no-store" }),
        ]);
        if (teamRes.ok) {
          const d = (await teamRes.json()) as { team: TeamMember[] };
          setTeamMembers(d.team ?? []);
        }
        if (inviteRes.ok) {
          const d = (await inviteRes.json()) as { inviteCodes: InviteCode[] };
          setInviteCodes(d.inviteCodes ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const maxBar = Math.max(...GROWTH_BARS.map((b) => b.users));

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
          value={teamMembers.length}
          icon={Users}
          color="#1d9bf0"
          bg="#1d9bf015"
          border="#1d9bf044"
          href="/admin/users"
          loading={loading}
        />
        <StatCard
          label="Verified Analysts"
          value={teamMembers.filter((m) => m.isVerifiedAnalyst).length}
          icon={BadgeCheck}
          color="#2ecf87"
          bg="#2ecf8715"
          border="#2ecf8744"
          href="/admin/users"
          loading={loading}
        />
        <StatCard
          label="Active Invites"
          value={inviteCodes.filter((c) => c.is_active).length}
          icon={Ticket}
          color="#ffb347"
          bg="#ffb34715"
          border="#ffb34744"
          href="/admin/invites"
          loading={loading}
        />
        <StatCard
          label="Open Complaints"
          value={2}
          icon={Flag}
          color="#ff4b55"
          bg="#ff4b5515"
          border="#ff4b5544"
          href="/admin/complaints"
          loading={false}
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
            <div className="flex items-end gap-3 h-36">
              {GROWTH_BARS.map((bar) => (
                <div key={bar.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[var(--ink-primary)]">{bar.users}</span>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${(bar.users / maxBar) * 100}%`,
                      background: "linear-gradient(180deg, #1d9bf0 0%, #1d9bf055 100%)",
                      minHeight: 4,
                    }}
                  />
                  <span className="text-[10px] text-[var(--ink-muted)]">{bar.month}</span>
                </div>
              ))}
            </div>
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
            {RECENT_ACTIVITY_MOCK.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--ink-primary)]">{item.message}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">{item.time}</p>
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
