import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: "How Financial Vibe collects, uses, protects, and shares data, including analytics, advertising, cookies, and third-party embeds.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <h1 className="font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Last updated: June 6, 2026. This policy explains what data Financial Vibe collects, why we collect it, how we protect it,
          and how advertising and third-party tools may process information.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Information We Collect</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We collect account details (such as email and profile metadata), platform activity (such as forum participation and feature usage),
          preferences, device/browser information, and technical data required for security, session integrity, and service reliability.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">How We Use Information</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We use data to operate and improve platform features, deliver account functionality, protect user safety, moderate content,
          investigate abuse or policy violations, understand site performance, and maintain educational market tools.
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
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Advertising Services</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Financial Vibe may work with third-party advertising providers. Advertising partners may use cookies or similar
          technologies to serve, personalize, measure, and limit ads where permitted. Users can manage ad-related storage and
          tracking through browser controls and any choices made available by the relevant advertising provider.
        </p>
      </section>

      <section className="ff-panel p-5 space-y-3">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Cookies, Analytics, and Embeds</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          We use cookies and local storage for authentication, security, preferences, notifications, and basic functionality.
          We may use Vercel Analytics to understand performance. Third-party embeds such as market charts, news widgets, and translation
          tools may process data under their own policies.
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
          what data we hold and how it is processed by contacting {SUPPORT_EMAIL}.
        </p>
      </section>
    </div>
  );
}
