"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { MarketKey } from "@/types";
import type { NewsItem } from "@/types/api";
import { useMarket } from "@/components/layout/MarketContext";
import { cn } from "@/lib/utils";
import { TIME_PREFERENCES_EVENT, formatDateWithPreferences, readTimePreferences, type TimePreferences } from "@/lib/timePreferences";

const HYDRATION_SAFE_TIME_PREFERENCES: TimePreferences = { timeZone: "UTC", timeFormat: "ampm" };

const SOURCE_KEYWORD = "financial juice";

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
  const response = await fetch(`/api/news/financialjuice?market=${apiMarket}`, { cache: "no-store" });
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
  const [timePreferences, setTimePreferences] = useState(HYDRATION_SAFE_TIME_PREFERENCES);
  const [copyStatus, setCopyStatus] = useState("");

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
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refresh = async (isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      }

      try {
        const response = await fetchFinancialJuiceFeed(market);
        if (!mounted) return;

        const latest = response.rows.filter(isFinancialJuiceItem).slice(0, 12);
        if (latest.length > 0) {
          setItems((prev) => dedupeById([...latest, ...prev]).slice(0, 12));
          setDelayed(false);
        } else {
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
    intervalId = setInterval(() => {
      void refresh(false);
    }, 12000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [market]);

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
    const streamUrl = `/api/news/live?market=${market}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { items?: NewsItem[] };
        const incoming = payload.items;
        if (!Array.isArray(incoming) || incoming.length === 0) return;

        const liveItems = incoming.filter(isFinancialJuiceItem);
        if (liveItems.length === 0) return;

        setItems((prev) => dedupeById([...liveItems, ...prev]).slice(0, 12));
        setDelayed(false);
      } catch {
        // Ignore malformed events to keep stream alive.
      }
    };

    eventSource.onerror = () => {
      setDelayed(true);
    };

    return () => {
      eventSource.close();
    };
  }, [market]);

  return (
    <section className="ff-panel overflow-hidden">
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

      <div className="ff-scroll max-h-[320px] overflow-y-auto bg-[var(--surface-2)]">
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
