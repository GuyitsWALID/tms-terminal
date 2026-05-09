"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Globe,
  GraduationCap,
  LineChart,
  Menu,
  Newspaper,
  Search,
  ShieldCheck,
  Sun,
  Moon,
  BarChart3,
  Wrench,
  Home,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MARKET_ORDER, getMarketDefinition } from "@/lib/market";
import type { HeaderNotificationItem, HeaderSearchResult, HeaderSearchScope } from "@/types";
import { MarketProvider, useMarket } from "@/components/layout/MarketContext";
import TradingViewTickerTape from "@/components/charts/TradingViewTickerTape";
import LiveSessionsPanel from "@/components/layout/LiveSessionsPanel";
import ManageAlertsModal from "@/components/calendar/ManageAlertsModal";
import { fetchHeaderNotifications, fetchUnifiedSearch, fetchAuthStatus } from "@/lib/api/dataService";
import {
  TIME_PREFERENCES_EVENT,
  TIME_ZONE_OPTIONS,
  type TimePreferences,
  formatDateWithPreferences,
  getTimeZoneLabel,
  readTimePreferences,
  saveTimePreferences,
} from "@/lib/timePreferences";

const menuItems = [
  { id: "calendar", name: "Calendar", icon: Calendar, path: "/calendar" },
  { id: "news", name: "News", icon: Newspaper, path: "/news" },
  { id: "analysis", name: "Analysis", icon: LineChart, path: "/analysis" },
  { id: "charts", name: "Markets", icon: BarChart3, path: "/charts" },
  { id: "academy", name: "Academy", icon: GraduationCap, path: "/academy" },
  { id: "forum", name: "Forum", icon: ShieldCheck, path: "/forum" },
];

const SEARCH_SCOPE_TABS: Array<{ id: HeaderSearchScope; label: string }> = [
  { id: "all", label: "All" },
  { id: "website", label: "Website" },
  { id: "forum", label: "Forum" },
  { id: "news", label: "News" },
];

const NOTIFICATION_READ_STORAGE_KEY = "tms-read-notification-ids-v1";

function GlobalLayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isAdminRoute = pathname.startsWith("/admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isManageAlertsOpen, setIsManageAlertsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTimeSettingsOpen, setIsTimeSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<HeaderSearchScope>("all");
  const [searchResults, setSearchResults] = useState<HeaderSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notificationItems, setNotificationItems] = useState<HeaderNotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [timePreferences, setTimePreferences] = useState<TimePreferences>({ timeZone: "UTC", timeFormat: "ampm" });
  const [timePreferencesDraft, setTimePreferencesDraft] = useState<TimePreferences>({ timeZone: "UTC", timeFormat: "ampm" });
  const [now, setNow] = useState("--:--:--");
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const timeMenuRef = useRef<HTMLDivElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const { market, setMarket } = useMarket();

  const timezoneLabel = getTimeZoneLabel(timePreferences.timeZone);
  const unreadCount = notificationItems.filter((item) => !readNotificationIds.includes(item.id)).length;

  const formatClock = (preferences: TimePreferences) =>
    formatDateWithPreferences(new Date(), preferences, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("tms-theme");
    const initialTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.setAttribute("data-theme", initialTheme);

    const initialTimePreferences = readTimePreferences();

    const syncTheme = window.setTimeout(() => {
      setTheme(initialTheme);
    }, 0);

    const syncClock = window.setTimeout(() => {
      setTimePreferences(initialTimePreferences);
      setTimePreferencesDraft(initialTimePreferences);
      setNow(formatClock(initialTimePreferences));
    }, 0);

    return () => {
      window.clearTimeout(syncTheme);
      window.clearTimeout(syncClock);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(formatClock(timePreferences));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [timePreferences]);

  useEffect(() => {
    const handleTimePreferencesUpdate = () => {
      const latest = readTimePreferences();
      setTimePreferences(latest);
      setTimePreferencesDraft(latest);
    };

    window.addEventListener(TIME_PREFERENCES_EVENT, handleTimePreferencesUpdate as EventListener);

    return () => {
      window.removeEventListener(TIME_PREFERENCES_EVENT, handleTimePreferencesUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const syncReadState = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return;
        const ids = parsed.filter((item) => typeof item === "string");
        setReadNotificationIds(ids);
      } catch {
        // Ignore bad local storage data.
      }
    }, 0);

    return () => {
      window.clearTimeout(syncReadState);
    };
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await fetchUnifiedSearch(searchQuery, searchScope, market);
        setSearchResults(response.results);
      } catch {
        setSearchError("Search is temporarily unavailable.");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery, searchScope, market]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const loadNotifications = async () => {
      setNotificationsLoading(true);

      try {
        const permission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
        const response = await fetchHeaderNotifications(permission);
        setNotificationItems(response.items);
      } catch {
        setNotificationItems([
          {
            id: "notifications-unavailable",
            kind: "system-notice",
            title: "Notifications unavailable",
            message: "Unable to load notifications right now. Please try again.",
            severity: "warning",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    void loadNotifications();
  }, [isNotificationsOpen]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }

      if (timeMenuRef.current && !timeMenuRef.current.contains(target)) {
        setIsTimeSettingsOpen(false);
      }

      if (searchMenuRef.current && !searchMenuRef.current.contains(target)) {
        setIsSearchOpen(false);
      }

      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileMenuOpen || isTimeSettingsOpen || isSearchOpen || isNotificationsOpen) {
      window.addEventListener("mousedown", handleOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleOutside);
    };
  }, [isProfileMenuOpen, isTimeSettingsOpen, isSearchOpen, isNotificationsOpen]);

  useEffect(() => {
    const handleTvPermissionRejection = (event: PromiseRejectionEvent) => {
      const reasonText = typeof event.reason === "string" ? event.reason : String(event.reason ?? "");
      const lowered = reasonText.toLowerCase();
      if (lowered.includes("[tv]") && lowered.includes("permission denied")) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleTvPermissionRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleTvPermissionRejection);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("tms-theme", nextTheme);
  };

  const persistReadNotificationIds = (ids: string[]) => {
    setReadNotificationIds(ids);
    window.localStorage.setItem(NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(ids));
  };

  const markNotificationRead = (id: string) => {
    if (readNotificationIds.includes(id)) return;
    persistReadNotificationIds([...readNotificationIds, id]);
  };

  const markAllNotificationsRead = () => {
    const allIds = Array.from(new Set([...readNotificationIds, ...notificationItems.map((item) => item.id)]));
    persistReadNotificationIds(allIds);
  };

  const onSaveTimeSettings = () => {
    saveTimePreferences(timePreferencesDraft);
    setTimePreferences(timePreferencesDraft);
    setIsTimeSettingsOpen(false);
  };

  const onCancelTimeSettings = () => {
    setTimePreferencesDraft(timePreferences);
    setIsTimeSettingsOpen(false);
  };

  const [authStatus, setAuthStatus] = useState<{ isAuthenticated: boolean; profile?: { role?: "user" | "analyst" | "admin" } } | null>(null);
  useEffect(() => {
    fetchAuthStatus().then(setAuthStatus);
  }, []);

  const isAdminUser = authStatus?.profile?.role === "admin";

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(900px_500px_at_100%_0%,rgba(59,130,246,0.10),transparent_55%),var(--bg-main)] px-4 py-8 sm:px-6 lg:px-8">
        <main className="mx-auto w-full max-w-6xl">{children}</main>
      </div>
    );
  }

  if (isAdminRoute) {
    return <div className="min-h-screen bg-[var(--bg-main)]">{children}</div>;
  }

  return (
    <>
    <div className="ff-shell">
      <div className="mx-auto w-full max-w-[1920px] xl:grid xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--line-strong)] bg-[var(--surface-2)] xl:block" aria-label="Left ad space">
          <div className="sticky top-20 px-4 py-6">
            <div className="rounded border border-dashed border-[var(--line-soft)] bg-[var(--surface-1)]/55 px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Ad Space 
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="ff-topbar sticky top-0 z-50">
            <div className="mx-auto flex h-16 w-full max-w-[1460px] items-center justify-between gap-4 px-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4 xl:gap-5">
            <Link href="/" className="flex shrink-0 items-center gap-2 border-r border-[var(--line-soft)] pr-3 xl:pr-4">
              <Image
                src="/finacialvibe2.png"
                alt="Financial Vibe Logo"
                width={40}
                height={40}
                
                priority
              />
              <div className="hidden sm:block">
                <p className="font-rajdhani text-xl font-bold uppercase leading-none tracking-wide">Financial Vibe</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">Feel the Market. Act on Data</p>
              </div>
            </Link>

            <Link
              href="/"
              aria-label="Home"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)] lg:flex"
            >
              <Home size={16} />
            </Link>

            <Link
              href="/tools"
              className={cn(
                "hidden shrink-0 whitespace-nowrap rounded-md px-2 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors 2xl:px-2.5 lg:flex",
                pathname === "/tools"
                  ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
              )}
            >
              Order Flow
            </Link>

            <nav className="mr-1 hidden min-w-0 items-center gap-1.5 xl:mr-2 2xl:mr-3 lg:flex">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-md px-2 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors 2xl:px-2.5",
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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative hidden xl:block" ref={searchMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen((open) => !open);
                  setIsNotificationsOpen(false);
                }}
                className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-1.5 text-[var(--ink-primary)] sm:p-2"
                aria-label="Open search"
                aria-expanded={isSearchOpen}
                aria-haspopup="dialog"
              >
                <Search size={14} />
              </button>

              {isSearchOpen ? (
                <div
                  className="absolute right-0 top-11 z-[70] w-[min(34rem,84vw)] rounded-md border border-[var(--line-strong)] bg-[var(--surface-1)] p-2 shadow-lg"
                  role="dialog"
                  aria-label="Search"
                >
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search events, pairs, analysts"
                      className="h-9 w-full rounded-full border border-[var(--line-strong)] bg-[var(--surface-1)] pl-9 pr-4 text-xs text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)]"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    {SEARCH_SCOPE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSearchScope(tab.id)}
                        className={cn(
                          "rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                          searchScope === tab.id
                            ? "border-[var(--brand)] bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                            : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 max-h-[52vh] overflow-y-auto rounded border border-[var(--line-soft)] bg-[var(--surface-2)]">
                    {searchLoading ? (
                      <p className="p-3 text-xs text-[var(--ink-muted)]">Searching...</p>
                    ) : searchError ? (
                      <p className="p-3 text-xs text-[#ffb38f]">{searchError}</p>
                    ) : searchResults.length === 0 ? (
                      <p className="p-3 text-xs text-[var(--ink-muted)]">No results found.</p>
                    ) : (
                      searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={result.href}
                          onClick={() => setIsSearchOpen(false)}
                          className="block border-b border-[var(--line-soft)] px-3 py-2 last:border-b-0 hover:bg-[var(--surface-hover)]"
                        >
                          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase text-[var(--ink-muted)]">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 font-bold",
                                result.sourceType === "website"
                                  ? "bg-[#7fb3ff22] text-[#8bc0ff]"
                                  : result.sourceType === "forum"
                                    ? "bg-[#9e8bff22] text-[#bcaeff]"
                                    : "bg-[#6ed1a522] text-[#80e4b8]"
                              )}
                            >
                              {result.sourceLabel}
                            </span>
                            {result.createdAt ? <span>{new Date(result.createdAt).toLocaleString()}</span> : null}
                          </div>
                          <p className="text-sm font-semibold text-[var(--ink-primary)]">{result.title}</p>
                          <p className="text-xs text-[var(--ink-muted)]">{result.snippet}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative hidden items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 2xl:flex">
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as typeof market)}
                className="appearance-none bg-transparent pr-5 text-xs font-semibold text-[var(--ink-primary)] outline-none"
              >
                {MARKET_ORDER.map((marketOption) => (
                  <option key={marketOption} value={marketOption} className="bg-[var(--surface-1)]">
                    {getMarketDefinition(marketOption).label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 text-[var(--ink-muted)]" />
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-1.5 text-[var(--ink-primary)] sm:p-2"
              aria-label="Toggle light and dark mode"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <div className="relative flex items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-1.5 py-1 text-[var(--ink-primary)] 2xl:hidden sm:px-2 sm:py-1.5">
              <Globe size={14} className="pointer-events-none mr-1 text-[var(--ink-muted)]" />
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as typeof market)}
                className="appearance-none bg-transparent pr-4 text-[11px] font-semibold text-[var(--ink-primary)] outline-none sm:text-xs"
                aria-label="Select market"
              >
                {MARKET_ORDER.map((marketOption) => (
                  <option key={marketOption} value={marketOption} className="bg-[var(--surface-1)]">
                    {getMarketDefinition(marketOption).label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-1.5 text-[var(--ink-muted)]" />
            </div>

            <div className="relative" ref={notificationsMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotificationsOpen((open) => !open);
                  setIsSearchOpen(false);
                }}
                className="relative rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-1.5 text-[var(--ink-primary)] sm:p-2"
                aria-label="Open notifications"
                aria-expanded={isNotificationsOpen}
                aria-haspopup="dialog"
              >
                <Bell size={14} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-[#ff4b55] px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className="absolute right-0 top-11 z-[70] w-[min(26rem,86vw)] rounded-md border border-[var(--line-strong)] bg-[var(--surface-1)] p-2 shadow-lg" role="dialog" aria-label="Notifications">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="ff-panel-title text-xs text-[var(--ink-primary)]">Notifications</p>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[52vh] overflow-y-auto rounded border border-[var(--line-soft)] bg-[var(--surface-2)]">
                    {notificationsLoading ? (
                      <p className="p-3 text-xs text-[var(--ink-muted)]">Loading notifications...</p>
                    ) : notificationItems.length === 0 ? (
                      <p className="p-3 text-xs text-[var(--ink-muted)]">No notifications right now.</p>
                    ) : (
                      notificationItems.map((item) => {
                        const isRead = readNotificationIds.includes(item.id);

                        return (
                          <div key={item.id} className={cn("border-b border-[var(--line-soft)] p-3 last:border-b-0", isRead ? "opacity-65" : "opacity-100")}>
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                  item.severity === "critical"
                                    ? "bg-[#ff4b5522] text-[#ff9ea3]"
                                    : item.severity === "warning"
                                      ? "bg-[#ffb34722] text-[#ffd28e]"
                                      : "bg-[#7fb3ff22] text-[#a5ccff]"
                                )}
                              >
                                {item.kind.replace("-", " ")}
                              </span>
                              {!isRead ? <span className="h-1.5 w-1.5 rounded-full bg-[#39db93]" /> : null}
                            </div>
                            <p className="text-sm font-semibold text-[var(--ink-primary)]">{item.title}</p>
                            <p className="mt-1 text-xs text-[var(--ink-muted)]">{item.message}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] text-[var(--ink-muted)]">{new Date(item.createdAt).toLocaleString()}</span>
                              <div className="flex items-center gap-2">
                                {!isRead ? (
                                  <button
                                    type="button"
                                    onClick={() => markNotificationRead(item.id)}
                                    className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                                  >
                                    Mark read
                                  </button>
                                ) : null}
                                {item.actionHref ? (
                                  <Link
                                    href={item.actionHref}
                                    onClick={() => {
                                      markNotificationRead(item.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-primary)]"
                                  >
                                    Open
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-2 text-right text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Unread: {unreadCount}</div>
                </div>
              ) : null}
            </div>

            <div className="relative hidden sm:block" ref={timeMenuRef}>
              <button
                onClick={() => setIsTimeSettingsOpen((open) => !open)}
                className="w-[132px] xl:w-[170px] shrink-0 rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-1.5 text-left"
                aria-expanded={isTimeSettingsOpen}
                aria-haspopup="dialog"
                aria-label="Open time settings"
              >
                <p className="font-rajdhani text-base leading-none whitespace-nowrap">{now}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">{timezoneLabel}</p>
              </button>

              {isTimeSettingsOpen ? (
                <div className="absolute right-0 top-12 z-[70] w-[340px] rounded-md border border-[var(--line-strong)] bg-[var(--surface-1)] p-4 shadow-lg" role="dialog" aria-label="Time settings">
                  <p className="mb-3 text-sm text-[var(--ink-muted)]">
                    Above is the synchronized time. It matches your device clock, and all timestamps are displayed in your selected local time.
                  </p>

                  <div className="mb-3 grid gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Time Zone</label>
                    <select
                      value={timePreferencesDraft.timeZone}
                      onChange={(event) => setTimePreferencesDraft((current) => ({ ...current, timeZone: event.target.value }))}
                      className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-sm text-[var(--ink-primary)] outline-none"
                    >
                      {TIME_ZONE_OPTIONS.map((zone) => (
                        <option key={zone} value={zone}>
                          {getTimeZoneLabel(zone)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 grid gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Time Format</label>
                    <select
                      value={timePreferencesDraft.timeFormat}
                      onChange={(event) =>
                        setTimePreferencesDraft((current) => ({
                          ...current,
                          timeFormat: event.target.value as TimePreferences["timeFormat"],
                        }))
                      }
                      className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-sm text-[var(--ink-primary)] outline-none"
                    >
                      <option value="ampm">am / pm</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onSaveTimeSettings}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]"
                    >
                      Save Settings
                    </button>
                    <button
                      type="button"
                      onClick={onCancelTimeSettings}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-1.5 text-[var(--ink-primary)] sm:p-2"
                aria-label="Open user profile menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
              >
                {isAdminUser ? <BarChart3 size={14} /> : <User size={14} />}
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-11 z-[70] w-48 rounded-md border border-[var(--line-strong)] bg-[var(--surface-1)] p-2 shadow-lg" role="menu" aria-label="Profile menu">
                  {isAdminUser ? (
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="mb-2 block rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs text-center font-semibold uppercase tracking-wide text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="mb-2 block rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs text-center font-semibold uppercase tracking-wide text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                  )}
                  {authStatus?.isAuthenticated ? (
                    <button
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        setIsProfileMenuOpen(false);
                        window.location.reload();
                      }}
                      className="block w-full rounded-md bg-red-600 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white hover:bg-red-700 mt-2"
                      role="menuitem"
                    >
                      Log out
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="mb-2 block w-full rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                        role="menuitem"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block w-full rounded-md bg-[var(--brand-strong)] px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white hover:opacity-90"
                        role="menuitem"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <button className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-1.5 sm:p-2 lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
            </div>

            {!isMobileMenuOpen ? (
              <div className="border-t border-[var(--line-soft)] bg-[var(--surface-1)]">
                <div className="ticker-marquee w-full">
                  <TradingViewTickerTape />
                </div>
              </div>
            ) : null}
          </header>

          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-[var(--bg-main)] p-4 pt-20 sm:p-6 sm:pt-20 lg:hidden">
              <nav className="space-y-2">
                {[{ id: "home", name: "Home", icon: Home, path: "/" }, { id: "tools", name: "Tools", icon: Wrench, path: "/tools" }, ...menuItems].map((item) => (
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
              <div className="mb-3">
                <LiveSessionsPanel market={market} showTraders={false} />
              </div>

              <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-3">
                <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
                  <Bell size={14} />
                  <p className="ff-panel-title text-xs">Event Alerts</p>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">Receive notifications 5 minutes before starred events, with verified trader summaries.</p>
                <button
                  type="button"
                  onClick={() => setIsManageAlertsOpen(true)}
                  className="mt-3 w-full rounded-md bg-[var(--brand-strong)] py-2 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
                >
                  Manage Alerts
                </button>
              </div>
            </aside>

            <main className="ff-grid-entrance min-w-0">{children}</main>
          </div>
        </div>


      </div>
      <footer className="w-full border-t border-[var(--line-strong)] bg-[var(--surface-2)] py-6 mt-8">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 px-4 text-xs text-[var(--ink-muted)]">
          <div className="flex items-center gap-2">
            <Image src="/TMSLOGO.png" alt="TMS Logo" width={28} height={28} className="h-7 w-7 rounded object-cover" />
            <span className="font-bold text-[var(--ink-primary)]">TMS Terminal</span>
            <span className="hidden md:inline">| The Market Syndicate</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span>&copy; {new Date().getFullYear()} TMS Terminal. All rights reserved.</span>
            <Link href="/about" className="hover:underline text-[var(--ink-primary)]">About</Link>
            <Link href="/privacy" className="hover:underline text-[var(--ink-primary)]">Privacy Policy</Link>
            <Link href="/contact" className="hover:underline text-[var(--ink-primary)]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>

      <ManageAlertsModal
        isOpen={isManageAlertsOpen}
        onClose={() => setIsManageAlertsOpen(false)}
        market={market}
      />
    </>
  );
}

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketProvider>
      <GlobalLayoutBody>{children}</GlobalLayoutBody>
    </MarketProvider>
  );
}

