import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description: "Learn about Financial Vibe's educational market tools, original trading guides, community standards, and publisher mission.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <h1 className="font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">About Financial Vibe</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Financial Vibe is a trader-focused terminal built to reduce friction between information, context, and execution timing.
          Our goal is simple: make high-quality market intelligence accessible, fast, and actionable for serious retail traders and
          developing professionals.
        </p>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          We publish original educational guides alongside market tools so visitors can understand the reasoning, risks, and limitations
          behind the data they are viewing.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">What We Build</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We combine economic calendar context, live news flow, forum-based analyst collaboration, and execution-oriented tools into one
          environment so users spend less time context-switching and more time making informed decisions.
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          Our platform design emphasizes clarity under pressure: concise interfaces, role-aware moderation workflows, and practical tools
          that support day-to-day decision making across forex, indices, commodities, and crypto.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Our Mission</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We believe disciplined traders should have access to institutional-style structure without institutional-level cost barriers.
          Financial Vibe is built to close that gap with transparent, education-first workflows and practical market tooling.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Community Standard</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We maintain high standards around accuracy, accountability, and professionalism. Verified contributors, moderation controls,
          and auditable admin actions are part of our commitment to keeping the platform useful and trustworthy.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Editorial Standard</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Financial Vibe content is educational and process-focused. We separate market information from personal financial advice,
          label third-party resources clearly, and encourage users to verify data before making decisions.
        </p>
      </section>
    </div>
  );
}
