import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { learnArticles } from "@/lib/learn/articles";

export const metadata: Metadata = {
  title: `Learn | ${SITE_NAME}`,
  description: "Original Financial Vibe guides for macro trading, economic calendar preparation, risk management, psychology, market analysis, and trading process.",
  alternates: {
    canonical: `${SITE_URL}/learn`,
  },
};

export default function LearnPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Education Library</p>
        <h1 className="mt-2 font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)] sm:text-4xl">
          Learn Market Context Before You Trade
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
          Financial Vibe publishes original educational guides for traders who want to understand calendar events,
          market sessions, risk, and analysis tools before making decisions. These articles are educational only and
          do not provide personal investment advice.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className="ff-panel block p-4 transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1">{article.category}</span>
              <span>{article.readingMinutes} min read</span>
              <span>Updated {article.updatedAt}</span>
            </div>
            <h2 className="font-rajdhani text-xl font-bold uppercase leading-tight text-[var(--ink-primary)]">
              {article.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{article.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
