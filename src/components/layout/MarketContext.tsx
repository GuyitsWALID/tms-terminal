"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { normalizeMarket } from "@/lib/market";
import type { MarketKey } from "@/types";

type MarketContextValue = {
  market: MarketKey;
  setMarket: (market: MarketKey) => void;
};

const STORAGE_KEY = "tms-market";

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarket] = useState<MarketKey>(() => {
    if (typeof window === "undefined") return "forex";
    return normalizeMarket(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-market", market);
    window.localStorage.setItem(STORAGE_KEY, market);
  }, [market]);

  const value = useMemo(
    () => ({
      market,
      setMarket,
    }),
    [market]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within MarketProvider");
  }

  return context;
}
