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
    </div>
  );
}
