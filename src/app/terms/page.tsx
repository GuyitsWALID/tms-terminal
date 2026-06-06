import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Use | ${SITE_NAME}`,
  description: "Terms of use for Financial Vibe market education, tools, community features, and public content.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <h1 className="font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">Terms of Use</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
          Last updated: June 6, 2026. These terms explain how visitors and registered users may use {SITE_NAME}.
        </p>
      </section>

      {[
        {
          title: "Educational Use",
          body: `${SITE_NAME} provides market information, education, community discussion, and analysis tools. Content on the site is for general educational purposes and is not personal investment, financial, legal, or tax advice.`,
        },
        {
          title: "User Responsibility",
          body: "You are responsible for your own decisions, risk controls, account security, and compliance with laws that apply to you. Trading and investing can result in substantial losses.",
        },
        {
          title: "Platform Content",
          body: "We work to keep information useful and accurate, but market data, news, third-party widgets, community posts, and external links may be delayed, incomplete, or unavailable. You should verify important information with primary sources before relying on it.",
        },
        {
          title: "Community Standards",
          body: "Users may not post spam, abusive content, misleading claims, unlawful material, or content that violates another person or organization's rights. We may remove content, restrict accounts, or preserve records when needed for safety, moderation, or legal reasons.",
        },
        {
          title: "Contact",
          body: `Questions about these terms can be sent to ${SUPPORT_EMAIL}.`,
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
