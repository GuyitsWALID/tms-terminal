"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { MarketKey } from "@/types";
import type { NewsItem } from "@/types/api";
import { useMarket } from "@/components/layout/MarketContext";
import { cn } from "@/lib/utils";
import { TIME_PREFERENCES_EVENT, formatDateWithPreferences, readTimePreferences, type TimePreferences } from "@/lib/timePreferences";

const HYDRATION_SAFE_TIME_PREFERENCES: TimePreferences = { timeZone: "UTC", timeFormat: "ampm" };

const SOURCE_KEYWORD = "financial juice";
const FULL_DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_POLL_BASE_MS = 30_000;
const FALLBACK_POLL_CAP_MS = 120_000;
const RECONNECT_BASE_MS = 1_200;
const RECONNECT_CAP_MS = 10_000;
const STREAM_HEALTHY_STREAK_THRESHOLD = 2;

const isWithinLast24Hours = (publishedAt: string | undefined, nowMs: number) => {
  if (!publishedAt) return false;
  const publishedMs = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedMs)) return false;
  return publishedMs >= nowMs - FULL_DAY_MS && publishedMs <= nowMs;
};

const dedupeById = (items: NewsItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const isFinancialJuiceItem = (item: NewsItem) => item.source.toLowerCase().includes(SOURCE_KEYWORD);

const fetchFinancialJuiceFeed = async (market: MarketKey) => {
  const apiMarket = market === "stocks" ? "commodities" : market;
  const response = await fetch(`/api/news/financialjuice?market=${apiMarket}`);
  if (!response.ok) {
    throw new Error("FinancialJuice fetch failed");
  }

  const rows = (await response.json()) as NewsItem[];
  return {
    rows,
    fallback: response.headers.get("x-financialjuice-fallback") === "1",
  };
};

export default function FinancialJuiceLivePanel() {
  const { market } = useMarket();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [delayed, setDelayed] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [timePreferences, setTimePreferences] = useState(HYDRATION_SAFE_TIME_PREFERENCES);
  const [copyStatus, setCopyStatus] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const streamGenerationRef = useRef(0);
  const latestSequenceRef = useRef(0);
  const isHiddenRef = useRef(false);
  const streamHealthyStreakRef = useRef(0);

  useEffect(() => {
    setTimePreferences(readTimePreferences());

    const onTimePreferencesChange = () => {
      setTimePreferences(readTimePreferences());
    };

    window.addEventListener(TIME_PREFERENCES_EVENT, onTimePreferencesChange as EventListener);

    return () => {
      window.removeEventListener(TIME_PREFERENCES_EVENT, onTimePreferencesChange as EventListener);
    };
  }, []);

  const formatItemTimestamp = (item: NewsItem) => {
    if (!item.publishedAt) return item.timestamp;

    const parsed = new Date(item.publishedAt);
    if (Number.isNaN(parsed.getTime())) return item.timestamp;

    return formatDateWithPreferences(parsed, timePreferences, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    let mounted = true;

    const refresh = async (isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      }

      try {
        const response = await fetchFinancialJuiceFeed(market);
        if (!mounted) return;

        const nowMs = Date.now();
        const latest = response.rows.filter((item) => isFinancialJuiceItem(item) && isWithinLast24Hours(item.publishedAt, nowMs));
        if (latest.length > 0) {
          setItems((prev) => dedupeById([...latest, ...prev]).filter((item) => isWithinLast24Hours(item.publishedAt, nowMs)));
          setDelayed(false);
        } else {
          setItems([]);
          setDelayed(true);
        }
      } catch {
        if (!mounted) return;
        setDelayed(true);
      } finally {
        if (mounted && isInitial) {
          setLoading(false);
        }
      }
    };

    void refresh(true);

    return () => {
      mounted = false;
    };
  }, [market]);

  useEffect(() => {
    if (streamConnected && streamHealthyStreakRef.current >= STREAM_HEALTHY_STREAK_THRESHOLD) return;

    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const scheduleNext = () => {
      if (!mounted || (streamConnected && streamHealthyStreakRef.current >= STREAM_HEALTHY_STREAK_THRESHOLD)) return;
      const delay = Math.min(FALLBACK_POLL_CAP_MS, FALLBACK_POLL_BASE_MS * (2 ** Math.min(attempt, 3)));
      timer = setTimeout(runPoll, delay);
    };

    const runPoll = async () => {
      if (!mounted || (streamConnected && streamHealthyStreakRef.current >= STREAM_HEALTHY_STREAK_THRESHOLD)) return;
      if (document.hidden) {
        scheduleNext();
        return;
      }

      try {
        const response = await fetchFinancialJuiceFeed(market);
        if (!mounted) return;
        const nowMs = Date.now();
        const latest = response.rows.filter((item) => isFinancialJuiceItem(item) && isWithinLast24Hours(item.publishedAt, nowMs));
        if (latest.length > 0) {
          setItems((prev) => dedupeById([...latest, ...prev]).filter((item) => isWithinLast24Hours(item.publishedAt, nowMs)));
          setDelayed(false);
          attempt = 0;
        } else {
          setDelayed(true);
          attempt += 1;
        }
      } catch {
        if (!mounted) return;
        setDelayed(true);
        attempt += 1;
      } finally {
        scheduleNext();
      }
    };

    scheduleNext();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [market, streamConnected]);

  const onFindArticle = async (item: NewsItem) => {
    const exactHeadline = item.headline.trim();
    const fallbackText = `${item.headline}\n${item.source}\n${item.publishedAt ?? item.timestamp}`;

    try {
      await navigator.clipboard.writeText(exactHeadline || fallbackText);
      setCopyStatus("Headline copied. Opening Google search...");
      window.setTimeout(() => setCopyStatus(""), 2200);
    } catch {
      setCopyStatus("Opening Google search...");
      window.setTimeout(() => setCopyStatus(""), 2200);
    }

    const query = exactHeadline
      ? exactHeadline
      : `${item.source} ${item.timestamp}`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let mounted = true;

    const clearReconnectTimer = () => {
      if (!reconnectTimerRef.current) return;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const closeStream = () => {
      if (!eventSourceRef.current) return;
      eventSourceRef.current.onopen = null;
      eventSourceRef.current.onmessage = null;
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStreamConnected(false);
    };

    const scheduleReconnect = () => {
      if (!mounted || isHiddenRef.current) return;
      clearReconnectTimer();
      const attempt = reconnectAttemptRef.current++;
      const expo = Math.min(RECONNECT_CAP_MS, RECONNECT_BASE_MS * (2 ** Math.min(attempt, 5)));
      const jitter = Math.floor(Math.random() * 450);
      reconnectTimerRef.current = setTimeout(() => {
        connectStream();
      }, expo + jitter);
    };

    const connectStream = () => {
      if (!mounted) return;
      if (document.hidden) {
        isHiddenRef.current = true;
        return;
      }
      isHiddenRef.current = false;
      clearReconnectTimer();
      closeStream();
      const localGeneration = ++streamGenerationRef.current;
      const streamUrl = `/api/news/live?market=${market}`;
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;
      setStreamConnected(false);

      eventSource.onopen = () => {
        if (!mounted || localGeneration !== streamGenerationRef.current) return;
        reconnectAttemptRef.current = 0;
        streamHealthyStreakRef.current = 0;
        setStreamConnected(true);
        setDelayed(false);
      };

      eventSource.onmessage = (event) => {
        if (!mounted || localGeneration !== streamGenerationRef.current) return;
        try {
          const payload = JSON.parse(event.data) as { type?: string; sequence?: number; items?: NewsItem[] };

          if (payload.type === "reconnect") {
            closeStream();
            scheduleReconnect();
            return;
          }

          if (typeof payload.sequence === "number") {
            if (payload.sequence < latestSequenceRef.current) return;
            latestSequenceRef.current = payload.sequence;
          }

          const incoming = payload.items;
          if (!Array.isArray(incoming) || incoming.length === 0) return;

          const nowMs = Date.now();
          const liveItems = incoming.filter((item) => isFinancialJuiceItem(item) && isWithinLast24Hours(item.publishedAt, nowMs));
          if (liveItems.length === 0) return;

          streamHealthyStreakRef.current += 1;
          setItems((prev) => dedupeById([...liveItems, ...prev]).filter((item) => isWithinLast24Hours(item.publishedAt, nowMs)));
          setDelayed(false);
        } catch {
          // Ignore malformed events to keep stream controller active.
        }
      };

      eventSource.onerror = () => {
        if (!mounted || localGeneration !== streamGenerationRef.current) return;
        streamHealthyStreakRef.current = 0;
        closeStream();
        setDelayed(true);
        scheduleReconnect();
      };
    };

    const onVisibilityChange = () => {
      const hidden = document.hidden;
      isHiddenRef.current = hidden;
      if (hidden) {
        clearReconnectTimer();
        closeStream();
        return;
      }
      connectStream();
    };

    connectStream();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearReconnectTimer();
      closeStream();
    };
  }, [market]);

  return (
    <section className="ff-panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
        <div>
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Live News</h2>
          <p className="text-[11px] text-[var(--ink-muted)]">Direct and live news in minutes</p>
        </div>
      </div>

      {delayed ? (
        <div className="border-b border-[#ff9d7a55] bg-[#ff9d7a12] px-4 py-2 text-xs text-[#ffb38f]">
          Live source delayed. Showing last known FinancialJuice headlines while reconnecting.
        </div>
      ) : null}

      <div className="ff-scroll min-h-[320px] flex-1 overflow-y-auto bg-[var(--surface-2)]">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-[var(--ink-muted)]">
            {loading ? "Fetching current headlines..." : "No live FinancialJuice headlines available right now."}
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="border-b border-[var(--line-soft)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase text-[var(--ink-muted)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{formatItemTimestamp(item)}</span>
                  <span>|</span>
                  <span>{item.category}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-bold",
                      item.impact === "high"
                        ? "bg-[#ff4b55] text-white"
                        : item.impact === "medium"
                          ? "bg-[#ff9d2d] text-[#161616]"
                          : "bg-[#ffe27a] text-[#161616]"
                    )}
                  >
                    {item.impact}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void onFindArticle(item)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-primary)]"
                  aria-label="Find related article"
                >
                  <ArrowUpRight size={12} />
                </button>
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">{item.headline}</p>
            </article>
          ))
        )}
      </div>
      {copyStatus ? <p className="border-t border-[var(--line-soft)] px-4 py-2 text-xs text-[var(--ink-muted)]">{copyStatus}</p> : null}
    </section>
  );
}
