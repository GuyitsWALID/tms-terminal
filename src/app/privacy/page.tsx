export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <h1 className="font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Last updated: May 10, 2026. This policy explains what data Financial Vibe collects, why we collect it, and how we protect it.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Information We Collect</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We collect account details (such as email and profile metadata), platform activity (such as forum participation and feature usage),
          and technical data required for security, session integrity, and service reliability.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">How We Use Information</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We use data to operate and improve platform features, deliver account functionality, protect user safety, moderate content,
          and investigate abuse or policy violations.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Data Sharing</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We do not sell personal data. We may share limited information with infrastructure providers that process data on our behalf,
          and only as necessary to run, secure, and maintain the service.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Retention and Security</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We retain data for as long as needed for service operation, legal obligations, and dispute prevention. We apply industry-standard
          safeguards, but no platform can guarantee absolute security.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Your Choices</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          You may request account updates or deletion, subject to legal and operational constraints. You may also request clarification on
          what data we hold and how it is processed.
        </p>
      </section>
    </div>
  );
}
