"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeAlert,
  Bell,
  Calendar,
  ChevronRight,
  GraduationCap,
  LineChart,
  Menu,
  Newspaper,
  Search,
  ShieldCheck,
  Sun,
  Moon,
  BarChart3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sessions, tickerTape } from "@/lib/terminalData";

const menuItems = [
  { id: "terminal", name: "Terminal", icon: Activity, path: "/" },
  { id: "calendar", name: "Calendar", icon: Calendar, path: "/calendar" },
  { id: "news", name: "News", icon: Newspaper, path: "/news" },
  { id: "analysis", name: "Analysis", icon: LineChart, path: "/analysis" },
  { id: "charts", name: "Charts", icon: BarChart3, path: "/charts" },
  { id: "academy", name: "Academy", icon: GraduationCap, path: "/academy" },
  { id: "forum", name: "Forum", icon: ShieldCheck, path: "/forum" },
];

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [assetMode, setAssetMode] = useState("EURUSD");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [now, setNow] = useState("--:--:--");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("tms-theme");
    const initialTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.setAttribute("data-theme", initialTheme);

    const formatClock = () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());

    const syncTheme = window.setTimeout(() => {
      setTheme(initialTheme);
    }, 0);

    const syncClock = window.setTimeout(() => {
      setNow(formatClock());
    }, 0);

    const timer = window.setInterval(() => {
      setNow(formatClock());
    }, 1000);

    return () => {
      window.clearTimeout(syncTheme);
      window.clearTimeout(syncClock);
      window.clearInterval(timer);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("tms-theme", nextTheme);
  };

  return (
    <div className="ff-shell">
      <header className="ff-topbar sticky top-0 z-50">
        <div className="mx-auto flex h-14 w-full max-w-[1460px] items-center justify-between gap-4 px-3 md:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 border-r border-[var(--line-soft)] pr-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-strong)] font-black text-white">T</div>
              <div>
                <p className="font-rajdhani text-xl font-bold uppercase leading-none tracking-wide">TMS Terminal</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">Market Intelligence Grid</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={cn(
                    "rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                    pathname === item.path
                      ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden xl:flex">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                placeholder="Search events, pairs, analysts"
                className="h-8 w-64 rounded-full border border-[var(--line-strong)] bg-[var(--surface-1)] pl-9 pr-4 text-xs text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)]"
              />
            </div>

            <div className="hidden items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 sm:flex">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">Mode</span>
              <select
                value={assetMode}
                onChange={(e) => setAssetMode(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--ink-primary)] outline-none"
              >
                <option className="bg-[var(--surface-1)]">EURUSD</option>
                <option className="bg-[var(--surface-1)]">GBPUSD</option>
                <option className="bg-[var(--surface-1)]">USDJPY</option>
                <option className="bg-[var(--surface-1)]">XAUUSD</option>
              </select>
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-[var(--ink-primary)]"
              aria-label="Toggle light and dark mode"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button className="relative rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-[var(--ink-primary)]">
              <Bell size={14} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#ff4b55]" />
            </button>

            <div className="hidden w-[126px] shrink-0 rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-1.5 sm:block">
              <p className="font-rajdhani text-base leading-none whitespace-nowrap">{now}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">UTC</p>
            </div>

            <button className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--line-soft)] bg-[var(--surface-1)]">
          <div className="ff-scroll mx-auto flex max-w-[1460px] overflow-x-auto whitespace-nowrap px-1 md:px-4">
            {[...tickerTape, ...tickerTape].map((item, idx) => (
              <div key={`${item.symbol}-${idx}`} className="flex min-w-fit items-center gap-2 border-r border-[var(--line-soft)] px-4 py-2 text-xs">
                <span className="font-semibold text-[var(--ink-primary)]">{item.symbol}</span>
                <span className="font-mono text-[var(--ink-primary)]">{item.price}</span>
                <span className={cn("font-semibold", item.isUp ? "text-[#31d488]" : "text-[#ff7878]")}>{item.change}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--bg-main)] p-6 pt-20 lg:hidden">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] px-4 py-3 text-sm font-semibold uppercase tracking-wider"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={16} />
                  {item.name}
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </nav>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-[1460px] grid-cols-1 gap-4 px-3 py-4 md:px-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="ff-panel ff-grid-entrance hidden p-3 xl:block">
          <div className="mb-3 rounded-md border border-[var(--line-strong)] bg-[var(--surface-1)] p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Traders Online</p>
            <p className="mt-1 font-rajdhani text-4xl font-bold leading-none">18,508</p>
            <p className="text-xs text-[var(--ink-muted)]">Community sentiment active</p>
          </div>

          <div className="mb-3 space-y-2">
            <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Sessions</p>
            {sessions.map((session) => (
              <div key={session.name} className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--ink-primary)]">{session.name}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      session.active ? "bg-[#2ecf87] text-[#062114]" : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
                    )}
                  >
                    {session.active ? "Live" : "Closed"}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)]">{session.range}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <BadgeAlert size={14} />
              <p className="ff-panel-title text-xs">Event Alerts</p>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">Receive notifications 5 minutes before starred events, with verified trader summaries.</p>
            <button className="mt-3 w-full rounded-md bg-[var(--brand-strong)] py-2 text-xs font-bold uppercase tracking-wider text-white">Manage Alerts</button>
          </div>
        </aside>

        <main className="ff-grid-entrance min-w-0">{children}</main>
      </div>
    </div>
  );
}

