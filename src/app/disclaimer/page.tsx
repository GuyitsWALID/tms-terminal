import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Financial Disclaimer | ${SITE_NAME}`,
  description: "Financial Vibe educational disclaimer for market content, trading tools, third-party data, and community discussion.",
  alternates: {
    canonical: `${SITE_URL}/disclaimer`,
  },
};

export default function DisclaimerPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel border-[var(--line-soft)] p-5 transition-colors hover:border-[#ff4b55] focus-within:border-[#ff4b55]">
        <p className="ff-panel-title text-xs text-[var(--ink-muted)]">Important Risk Warning</p>
        <h1 className="mt-2 font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">Financial Disclaimer</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-muted)]">
          {SITE_NAME} is an educational market information platform. Nothing on this site is a recommendation to buy,
          sell, hold, or trade any financial instrument.
        </p>
      </section>

      <section className="ff-panel border-[var(--line-soft)] p-5 transition-colors hover:border-[#ff4b55] focus-within:border-[#ff4b55]">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">No Personalized Advice</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Our articles, widgets, forum posts, analyst perspectives, calendar notes, and educational tools are general
          information only. They do not consider your financial situation, experience, objectives, or risk tolerance.
        </p>
      </section>

      <section className="ff-panel border-[var(--line-soft)] p-5 transition-colors hover:border-[#ff4b55] focus-within:border-[#ff4b55]">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Trading Risk</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-muted)]">
          Forex, futures, stocks, commodities, crypto, and CFDs can be volatile and may involve leverage. You can lose
          more than expected. Always verify data, use independent judgment, and consider professional advice where appropriate.
        </p>
      </section>

      <section className="ff-panel border-[var(--line-soft)] p-5 transition-colors hover:border-[#ff4b55] focus-within:border-[#ff4b55]">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Third-Party Data</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Some market data, charts, news, embeds, and external resources are provided by third parties. We do not guarantee
          uninterrupted access, real-time accuracy, or completeness of third-party information.
        </p>
      </section>
    </div>
  );
}
