import { NextResponse } from "next/server";
import { normalizeMarket } from "@/lib/market";
import { fetchFinancialJuiceWithFallback } from "@/lib/news/financialJuiceSource";
import { addFinancialJuiceLiveItem } from "@/lib/news/liveFinancialJuiceStore";

export const dynamic = "force-dynamic";
const FULL_DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_MAX_ITEMS = Number(process.env.FINANCIAL_JUICE_MAX_DAY_ITEMS ?? 500);

const isWithinLast24Hours = (publishedAt: string | undefined, nowMs: number) => {
  if (!publishedAt) return false;
  const publishedMs = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedMs)) return false;
  return publishedMs >= nowMs - FULL_DAY_MS && publishedMs <= nowMs;
};

export async function GET(request: Request) {
  const market = normalizeMarket(new URL(request.url).searchParams.get("market"));

  try {
    const resolved = await fetchFinancialJuiceWithFallback(market);
    const nowMs = Date.now();
    const scopedByDay = resolved.items.filter((item) => isWithinLast24Hours(item.publishedAt, nowMs));
    const scoped = scopedByDay.length > 0 ? scopedByDay : resolved.items.slice(0, FALLBACK_MAX_ITEMS);
    const seededForLiveStore = [...scoped].sort(
      (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

    seededForLiveStore.forEach((item) => {
      addFinancialJuiceLiveItem({
        ...item,
        rawText: item.headline,
        receivedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json(scoped, {
      headers: {
        "Cache-Control": resolved.usedFallback
          ? "public, s-maxage=30, stale-while-revalidate=120"
          : "no-store",
        "x-financialjuice-cache": resolved.usedFallback ? "MISS" : "BYPASS",
        "x-financialjuice-source": resolved.source,
        "x-financialjuice-fallback": resolved.usedFallback ? "1" : "0",
        ...(resolved.fallbackReason ? { "x-financialjuice-fallback-reason": resolved.fallbackReason } : {}),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown-financialjuice-error";
    console.error("FinancialJuice fetch warning:", message);

    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        "x-financialjuice-cache": "MISS",
        "x-financialjuice-source": "none",
        "x-financialjuice-fallback": "1",
        "x-financialjuice-fallback-reason": "fetch-failed",
      },
    });
  }
}
