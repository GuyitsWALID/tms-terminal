import { NextResponse } from "next/server";
import { normalizeMarket } from "@/lib/market";
import { fetchFinancialJuiceWithFallback } from "@/lib/news/financialJuiceSource";
import { addFinancialJuiceLiveItem } from "@/lib/news/liveFinancialJuiceStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const market = normalizeMarket(new URL(request.url).searchParams.get("market"));

  try {
    const resolved = await fetchFinancialJuiceWithFallback(market);
    const scoped = resolved.items.slice(0, 24);

    scoped.forEach((item) => {
      addFinancialJuiceLiveItem({
        ...item,
        rawText: item.headline,
        receivedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json(scoped, {
      headers: {
        "Cache-Control": "no-store",
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
        "Cache-Control": "no-store",
        "x-financialjuice-source": "none",
        "x-financialjuice-fallback": "1",
        "x-financialjuice-fallback-reason": "fetch-failed",
      },
    });
  }
}
