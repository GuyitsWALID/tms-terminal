import type { MetadataRoute } from "next";
import { learnArticles } from "@/lib/learn/articles";
import { SITE_URL } from "@/lib/site";

const publicRoutes = [
  "",
  "/learn",
  "/news",
  "/analysis",
  "/charts",
  "/calendar",
  "/tools",
  "/academy",
  "/forum",
  "/about",
  "/privacy",
  "/cookies",
  "/terms",
  "/disclaimer",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routeEntries = publicRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date("2026-06-06"),
    changeFrequency: route === "" || route === "/news" || route === "/calendar" ? "daily" as const : "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  const articleEntries = learnArticles.map((article) => ({
    url: `${SITE_URL}/learn/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...routeEntries, ...articleEntries];
}
