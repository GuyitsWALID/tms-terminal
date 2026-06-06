import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearnArticle, learnArticles } from "@/lib/learn/articles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return learnArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) return {};

  return {
    title: `${article.title} | ${SITE_NAME}`,
    description: article.description,
    alternates: {
      canonical: `${SITE_URL}/learn/${article.slug}`,
    },
  };
}

export default async function LearnArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) notFound();

  return (
    <article className="space-y-4">
      <section className="ff-panel p-5">
        <Link href="/learn" className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] hover:text-[var(--ink-primary)]">
          Back to Learn
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1">{article.category}</span>
          <span>{article.readingMinutes} min read</span>
          <span>Published {article.publishedAt}</span>
          <span>Updated {article.updatedAt}</span>
        </div>
        <h1 className="mt-3 font-rajdhani text-3xl font-bold uppercase leading-tight text-[var(--ink-primary)] sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">{article.description}</p>
        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          By {SITE_NAME} Editorial Desk. Educational content only, not personalized financial advice.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {article.sections.map((section) => (
            <section key={section.heading} className="ff-panel p-5">
              <h2 className="ff-panel-title text-base text-[var(--ink-primary)]">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-[var(--ink-muted)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-3">
          {article.checklist ? (
            <section className="ff-panel p-4">
              <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Checklist</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-muted)]">
                {article.checklist.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="ff-panel p-4">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Related Tools</h2>
            <div className="mt-3 space-y-2">
              {article.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="ff-panel border-[var(--line-soft)] p-4 transition-colors hover:border-[#ff4b55] focus-within:border-[#ff4b55]">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Risk Note</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-[var(--ink-muted)]">
              Trading and investing involve risk. Use this guide for education and verify current market data before making decisions.
            </p>
          </section>
        </aside>
      </div>
    </article>
  );
}
