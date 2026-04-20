"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsItem } from "@/types/api";
import { useMarket } from "@/components/layout/MarketContext";
import { cn } from "@/lib/utils";

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

const fetchFinancialJuiceFeed = async (market: "forex" | "crypto" | "commodities") => {
  const response = await fetch(`/api/news/financialjuice?market=${market}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("FinancialJuice fetch failed");
  }

  return (await response.json()) as NewsItem[];
};

export default function FinancialJuiceLivePanel() {
  const { market } = useMarket();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const response = await fetchFinancialJuiceFeed(market);
        if (!mounted) return;

        setItems(response.filter(isFinancialJuiceItem).slice(0, 12));
      } catch {
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      mounted = false;
    };
  }, [market]);

  useEffect(() => {
    const streamUrl = `/api/news/live?market=${market}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { items?: NewsItem[] };
        const incoming = payload.items;
        if (!Array.isArray(incoming) || incoming.length === 0) return;

        const liveItems = incoming.filter(isFinancialJuiceItem);
        if (liveItems.length === 0) return;

        setItems((prev) => dedupeById([...liveItems, ...prev]).slice(0, 12));
      } catch {
        // Ignore malformed events to keep stream alive.
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [market]);

  const statusLabel = useMemo(() => {
    if (loading) return "Syncing";
    if (connected) return "Live";
    return "Retrying";
  }, [connected, loading]);

  return (
    <section className="ff-panel overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
        <div>
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">FinancialJuice Live Wire</h2>
          <p className="text-[11px] text-[var(--ink-muted)]">Telegram headlines pushed into the terminal in near real time.</p>
        </div>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            connected ? "bg-[#2fd48822] text-[#39db93]" : "bg-[#ff9d7a22] text-[#ffb38f]"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="ff-scroll max-h-[320px] overflow-y-auto bg-[var(--surface-2)]">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-[var(--ink-muted)]">
            {loading ? "Fetching current headlines..." : "No live FinancialJuice Telegram headlines available right now."}
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="border-b border-[var(--line-soft)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-[var(--ink-muted)]">
                <span>{item.timestamp}</span>
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
              <p className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">{item.headline}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
