import { NextResponse } from "next/server";
import { EPS_CDN_CACHE_CONTROL, getEpsHistory } from "@/lib/api/earningsHistory";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const result = await getEpsHistory(symbol);
  if (result.cache === "ERROR") {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        "x-eps-cache": "ERROR",
        "x-eps-source": "yahoo-quoteSummary",
        "x-eps-symbol": result.symbol,
        "x-eps-error": result.error ?? "unknown",
      },
    });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": EPS_CDN_CACHE_CONTROL,
      "x-eps-cache": result.cache,
      "x-eps-source": "yahoo-quoteSummary",
      "x-eps-symbol": result.symbol,
      "x-eps-count": String(result.data.length),
    },
  });
}
