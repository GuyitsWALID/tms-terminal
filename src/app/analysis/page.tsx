"use client";

import { useMemo } from "react";
import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { analystPosts, marketSentiment } from "@/lib/terminalData";
import { useMarket } from "@/components/layout/MarketContext";

export default function AnalysisPage() {
  const { market } = useMarket();
  const visiblePosts = useMemo(() => analystPosts.filter((post) => post.market === market), [market]);
  const visibleSentiment = useMemo(() => marketSentiment.filter((row) => row.market === market), [market]);

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Verified Analysis Desk</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Institutional-style {market.toUpperCase()} commentary from verified traders before key economic events.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {visiblePosts.map((post) => (
            <article key={post.id} className="ff-panel p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-rajdhani text-2xl font-bold uppercase text-[var(--ink-primary)]">{post.title}</h2>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    post.bias === "bullish"
                      ? "bg-[#2fd488] text-[#082518]"
                      : post.bias === "bearish"
                        ? "bg-[#ff6a6a] text-[#2f0909]"
                        : "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                  }`}
                >
                  {post.bias}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
                <span>{post.author}</span>
                <span>|</span>
                <span>{post.desk}</span>
                <span>|</span>
                <span>{post.pair}</span>
                <span>|</span>
                <span>{post.published}</span>
              </div>

              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{post.summary}</p>

              <div className="mt-3 rounded border border-[var(--line-strong)] bg-[var(--surface-3)] p-3 text-xs">
                <p className="mb-1 text-[var(--ink-muted)]">Confidence Meter</p>
                <div className="h-2 overflow-hidden rounded bg-[var(--surface-1)]">
                  <div className="h-full bg-[var(--brand)]" style={{ width: `${post.confidence}%` }} />
                </div>
                <p className="mt-1 text-[var(--ink-primary)]">{post.confidence}% conviction score</p>
              </div>
            </article>
          ))}
          {visiblePosts.length === 0 ? (
            <article className="ff-panel p-4 text-sm text-[var(--ink-muted)]">No analyst posts available for this market yet. Switch market tabs or check back shortly.</article>
          ) : null}
        </div>

        <aside className="space-y-3">
          <div className="ff-panel p-3">
            <h3 className="ff-panel-title text-sm">Desk Guidelines</h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--ink-muted)]">
              <li>- Opinions are tied to specific calendar events.</li>
              <li>- Analysts publish bias and confidence before release.</li>
              <li>- Community can follow and receive event-time recap alerts.</li>
            </ul>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <BarChart3 size={14} />
              <h3 className="ff-panel-title text-sm">Crowd Positioning</h3>
            </div>
            <div className="space-y-2">
              {visibleSentiment.map((row) => (
                <div key={row.pair} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-2 text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink-primary)]">{row.pair}</span>
                    <span className="text-[var(--ink-muted)]">Long {row.long}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-[var(--surface-1)]">
                    <div className="h-full bg-[#34d58c]" style={{ width: `${row.long}%` }} />
                  </div>
                </div>
              ))}
              {visibleSentiment.length === 0 ? <p className="text-xs text-[var(--ink-muted)]">No sentiment rows available for this market.</p> : null}
            </div>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <ShieldCheck size={14} />
              <h3 className="ff-panel-title text-sm">Verification</h3>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">Only verified trader accounts can publish event predictions. Posts are tagged with specialization and historical accuracy.</p>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <Sparkles size={14} />
              <h3 className="ff-panel-title text-sm">AI Summary</h3>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">Current desk consensus: cautious USD bullishness with downside EUR pressure if ECB commentary turns more accommodative.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}



