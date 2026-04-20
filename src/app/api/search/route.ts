import { NextResponse } from "next/server";
import { normalizeMarket } from "@/lib/market";
import { featuredNews } from "@/lib/terminalData";
import { fetchFinancialJuiceWithFallback } from "@/lib/news/financialJuiceSource";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HeaderSearchResult, HeaderSearchScope, MarketKey } from "@/types";

const WEBSITE_INDEX: HeaderSearchResult[] = [
  {
    id: "website-home",
    title: "Home",
    snippet: "Live market overview, signal snapshots, and top terminal sections.",
    href: "/",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-calendar",
    title: "Calendar",
    snippet: "Economic calendar with impact filtering and event details.",
    href: "/calendar",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-news",
    title: "News",
    snippet: "Real-time macro/news feed including FinancialJuice live wire.",
    href: "/news",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-analysis",
    title: "Analysis",
    snippet: "Structured market analysis and scenario commentary.",
    href: "/analysis",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-markets",
    title: "Markets",
    snippet: "Multi-market charts and TradingView analysis widgets.",
    href: "/charts",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-forum",
    title: "Forum",
    snippet: "Community threads and trading discussions.",
    href: "/forum",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-academy",
    title: "Academy",
    snippet: "Learning content and guided market exercises.",
    href: "/academy",
    sourceType: "website",
    sourceLabel: "Website",
  },
  {
    id: "website-tools",
    title: "Tools",
    snippet: "Execution support utilities and terminal tools.",
    href: "/tools",
    sourceType: "website",
    sourceLabel: "Website",
  },
];

const MAX_RESULTS_PER_SOURCE = 12;

const includesQuery = (value: string, query: string) => value.toLowerCase().includes(query);

const rankWebsite = (query: string) => {
  if (!query) return WEBSITE_INDEX.slice(0, 8);

  return WEBSITE_INDEX.filter((item) => {
    const haystack = `${item.title} ${item.snippet}`.toLowerCase();
    return haystack.includes(query);
  }).slice(0, MAX_RESULTS_PER_SOURCE);
};

const rankForum = async (query: string) => {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("forum_threads")
    .select("id, title, content, category, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_RESULTS_PER_SOURCE);

  if (query) {
    request = request.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  }

  const { data, error } = await request;
  if (error || !data) return [] as HeaderSearchResult[];

  return data.map((row) => ({
    id: `forum-${row.id}`,
    title: row.title,
    snippet: row.content.slice(0, 160),
    href: "/forum",
    sourceType: "forum" as const,
    sourceLabel: "Forum",
    createdAt: row.updated_at ?? row.created_at,
  }));
};

const rankNews = async (query: string, market: MarketKey) => {
  const source = await fetchFinancialJuiceWithFallback(market);
  const base = source.items.length > 0 ? source.items : featuredNews;

  return base
    .filter((item) => {
      if (!query) return true;
      return includesQuery(`${item.headline} ${item.category} ${item.source}`, query);
    })
    .slice(0, MAX_RESULTS_PER_SOURCE)
    .map((item) => ({
      id: `news-${item.id}`,
      title: item.headline,
      snippet: `${item.source} | ${item.category}`,
      href: "/news",
      sourceType: "news" as const,
      sourceLabel: "News",
      createdAt: item.publishedAt,
    }));
};

const sortByRecency = (items: HeaderSearchResult[]) => {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = normalizeMarket(url.searchParams.get("market"));
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const scope = (url.searchParams.get("scope") ?? "all") as HeaderSearchScope;

  const [website, forum, news] = await Promise.all([
    Promise.resolve(rankWebsite(query)),
    rankForum(query),
    rankNews(query, market),
  ]);

  const all = sortByRecency([...website.slice(0, 4), ...forum.slice(0, 8), ...news.slice(0, 8)]);

  const scopedResults =
    scope === "website"
      ? website
      : scope === "forum"
        ? forum
        : scope === "news"
          ? news
          : all;

  return NextResponse.json(
    {
      query,
      scope,
      results: scopedResults,
      grouped: {
        website,
        forum,
        news,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
