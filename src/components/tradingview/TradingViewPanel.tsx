"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TradingViewPanelProps = {
  title: string;
  headerRight?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export default function TradingViewPanel({ title, headerRight, className, bodyClassName, children }: TradingViewPanelProps) {
  return (
    <section className={cn("ff-panel overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-3 py-2">
        <h2 className="ff-panel-title text-xs sm:text-sm text-[var(--ink-primary)]">{title}</h2>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </header>
      <div className={cn("bg-[var(--surface-2)] p-2 sm:p-3", bodyClassName)}>{children}</div>
    </section>
  );
}
