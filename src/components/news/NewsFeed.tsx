"use client";

import React, { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Headphones, Minus, Radio, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { featuredNews, hotStory } from "@/lib/terminalData";

const SentiMeter = ({ score }: { score: number }) => {
  const isBullish = score > 0.2;
  const isBearish = score < -0.2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-xs font-bold">
        {isBullish && <ArrowUpRight size={12} className="text-green-500" />}
        {isBearish && <ArrowDownRight size={12} className="text-red-500" />}
        {!isBullish && !isBearish && <Minus size={12} className="text-gray-400" />}
        <span className={cn(isBullish ? "text-green-500" : isBearish ? "text-red-500" : "text-gray-400")}>
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-1)]">
        <div
          className={cn("h-full transition-all duration-500", isBullish ? "bg-green-500" : isBearish ? "bg-red-500" : "bg-gray-400")}
          style={{ width: `${Math.abs(score * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default function NewsFeed() {
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [activeId, setActiveId] = useState(featuredNews[0]?.id ?? "");

  const filteredNews = useMemo(
    () => featuredNews.filter((item) => impactFilter === "all" || item.impact === impactFilter),
    [impactFilter]
  );

  const avgSentiment = useMemo(() => {
    const total = filteredNews.reduce((acc, item) => acc + item.sentimentScore, 0);
    return filteredNews.length ? total / filteredNews.length : 0;
  }, [filteredNews]);

  const activeNews = filteredNews.find((item) => item.id === activeId) ?? filteredNews[0];

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Signal News Terminal</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Curated headlines inspired by Financial Juice with sentiment scoring.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "high", "medium", "low"] as const).map((impact) => (
              <button
                key={impact}
                onClick={() => setImpactFilter(impact)}
                className={cn(
                  "rounded border px-2 py-1 text-xs font-bold uppercase tracking-wider",
                  impactFilter === impact
                    ? "border-[var(--brand)] bg-[var(--surface-hover)] text-white"
                    : "border-[var(--line-soft)] bg-[var(--surface-1)] text-[var(--ink-muted)]"
                )}
              >
                {impact}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="ff-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Live Feed</h2>
            <span className="rounded bg-[#2fd48822] px-2 py-0.5 text-[10px] font-bold uppercase text-[#39db93]">Connected</span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-[var(--line-soft)] bg-[var(--surface-2)] lg:grid-cols-[minmax(0,1fr)_340px] lg:divide-x lg:divide-y-0">
            <div className="ff-scroll max-h-[68vh] overflow-y-auto">
              {filteredNews.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "w-full border-b border-[var(--line-soft)] px-4 py-3 text-left hover:bg-[var(--surface-hover)]",
                    activeNews?.id === item.id && "bg-[var(--surface-hover)]"
                  )}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase text-[var(--ink-muted)]">
                    <span>{item.timestamp}</span>
                    <span>|</span>
                    <span>{item.source}</span>
                    <span>|</span>
                    <span>{item.category}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-bold sm:ml-auto",
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
                  <p className="text-sm font-semibold text-[var(--ink-primary)]">{item.headline}</p>
                  <div className="mt-2">
                    <SentiMeter score={item.sentimentScore} />
                  </div>
                </button>
              ))}
            </div>

            <aside className="space-y-3 p-3">
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
                  <TrendingUp size={15} />
                  <h3 className="ff-panel-title text-xs">Senti-Meter</h3>
                </div>
                <p className="font-rajdhani text-4xl leading-none">{(avgSentiment * 100).toFixed(0)}%</p>
                <p className="text-xs text-[var(--ink-muted)]">Aggregate headline sentiment</p>
                <div className="mt-3 h-2 overflow-hidden rounded bg-[var(--surface-1)]">
                  <div
                    className={cn("h-full", avgSentiment >= 0 ? "bg-[#2fd488]" : "bg-[#ff7171]")}
                    style={{ width: `${Math.min(100, Math.abs(avgSentiment) * 120)}%` }}
                  />
                </div>
              </div>

              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
                  <Radio size={15} />
                  <h3 className="ff-panel-title text-xs">Squawk</h3>
                </div>
                <p className="text-sm text-[var(--ink-muted)]">Audio dispatch stream for high-impact macro releases and central bank headlines.</p>
                <button className="mt-3 inline-flex items-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
                  <Headphones size={13} />
                  Listen Live
                </button>
              </div>

              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <h3 className="ff-panel-title text-xs text-[var(--ink-primary)]">Top Story</h3>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-primary)]">{hotStory.title}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{hotStory.source} | {hotStory.age}</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="ff-panel p-4">
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Story Focus</h2>
          <div className="mt-3 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3">
            <p className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">{activeNews?.source}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">{activeNews?.headline}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              This headline is tagged {activeNews?.impact} impact with a {(activeNews?.sentimentScore ?? 0) > 0 ? "bullish" : "bearish"} tilt. Use the calendar tab to pair this narrative with upcoming release risk.
            </p>
          </div>
          <div className="mt-3 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3">
            <h3 className="ff-panel-title text-xs text-[var(--ink-primary)]">Execution Notes</h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--ink-muted)]">
              <li>- Prioritize high-impact headlines within 20 minutes of release windows.</li>
              <li>- Cross-check sentiment with verified analyst bias before execution.</li>
              <li>- Push starred themes to notification alerts for pre-event prep.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}



