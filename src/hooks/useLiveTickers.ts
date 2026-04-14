"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchLiveTickersWithMeta, type LiveTicker } from "@/lib/api/dataService";
import { tickerTape } from "@/lib/terminalData";

type HookResult = {
  tickers: LiveTicker[];
  source: string;
  cache: string;
  fallbackReason: string;
  isLoading: boolean;
};

const FALLBACK_TICKERS: LiveTicker[] = tickerTape.map((item) => ({
  symbol: item.symbol as LiveTicker["symbol"],
  price: item.price,
  change: item.change,
  isUp: item.isUp,
}));

export function useLiveTickers(intervalMs = 1000): HookResult {
  const [tickers, setTickers] = useState<LiveTicker[]>(FALLBACK_TICKERS);
  const [source, setSource] = useState("local-fallback");
  const [cache, setCache] = useState("none");
  const [fallbackReason, setFallbackReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      if (document.hidden) {
        timer = setTimeout(load, intervalMs);
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const result = await fetchLiveTickersWithMeta();
        if (!mounted) return;
        if (Array.isArray(result.tickers) && result.tickers.length > 0) {
          setTickers(result.tickers);
        }
        setSource(result.source);
        setCache(result.cache);
        setFallbackReason(result.fallbackReason);
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) {
          setIsLoading(false);
          timer = setTimeout(load, intervalMs);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
      abortRef.current?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [intervalMs]);

  return useMemo(
    () => ({
      tickers,
      source,
      cache,
      fallbackReason,
      isLoading,
    }),
    [tickers, source, cache, fallbackReason, isLoading]
  );
}
