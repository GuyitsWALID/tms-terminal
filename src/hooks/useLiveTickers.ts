"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchLiveTickersWithMeta, type LiveTicker } from "@/lib/api/dataService";

type HookResult = {
  tickers: LiveTicker[];
  source: string;
  cache: string;
  fallbackReason: string;
  isLoading: boolean;
};

export function useLiveTickers(intervalMs = 1000): HookResult {
  const [tickers, setTickers] = useState<LiveTicker[]>([]);
  const [source, setSource] = useState("none");
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
        } else {
          setTickers([]);
        }
        setSource(result.source);
        setCache(result.cache);
        setFallbackReason(result.fallbackReason);
      } catch {
        if (!mounted) return;
        setTickers([]);
        setSource("none");
        setCache("none");
        setFallbackReason("yfinance-failed");
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
