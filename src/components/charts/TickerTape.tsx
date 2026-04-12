"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tickerTape } from "@/lib/terminalData";

export default function TickerTape() {
  return (
    <div className="ff-scroll flex overflow-x-auto whitespace-nowrap rounded border border-[var(--line-soft)] bg-[var(--surface-1)]">
      {[...tickerTape, ...tickerTape].map((pair, i) => (
        <div key={`${pair.symbol}-${i}`} className="flex min-w-fit items-center gap-2 border-r border-[var(--line-soft)] px-4 py-2 text-xs">
          <span className="font-semibold text-[var(--ink-primary)]">{pair.symbol}</span>
          <span className="font-mono text-[var(--ink-primary)]">{pair.price}</span>
          <span className={cn("flex items-center gap-0.5 font-bold", pair.isUp ? "text-[#2fd488]" : "text-[#ff7a7a]")}>
            {pair.isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {pair.change}
          </span>
        </div>
      ))}
    </div>
  );
}



