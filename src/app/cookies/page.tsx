import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Cookie Policy | ${SITE_NAME}`,
  description: "How Financial Vibe uses cookies, authentication storage, analytics, advertising technologies, and third-party embeds.",
  alternates: {
    canonical: `${SITE_URL}/cookies`,
  },
};

export default function CookiesPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <h1 className="font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">Cookie Policy</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Last updated: June 6, 2026. This page explains how {SITE_NAME} uses cookies and similar technologies.
        </p>
      </section>

      {[
        {
          title: "Essential Cookies",
          body: "We use essential cookies and local storage for login sessions, security, theme preferences, timezone settings, notification read state, and basic platform functionality.",
        },
        {
          title: "Analytics",
          body: "We may use privacy-conscious analytics, including Vercel Analytics, to understand page performance, feature usage, and reliability. Analytics help us improve the service without selling personal data.",
        },
        {
          title: "Advertising",
          body: "Financial Vibe may use Google AdSense. Google and its partners may use cookies or similar identifiers to serve ads, limit ad frequency, measure performance, and support ad personalization where permitted.",
        },
        {
          title: "Third-Party Embeds",
          body: "Pages may include third-party market widgets, charts, news feeds, translation tools, and external resources. Those providers may set their own cookies or collect usage information under their own policies.",
        },
        {
          title: "Your Choices",
          body: `You can manage cookies through your browser settings and Google ad personalization controls. For privacy questions, contact ${SUPPORT_EMAIL}.`,
        },
      ].map((section) => (
        <section key={section.title} className="ff-panel p-5">
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">{section.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{section.body}</p>
        </section>
      ))}
    </div>
  );
}
