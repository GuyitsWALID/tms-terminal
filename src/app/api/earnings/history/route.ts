import { NextResponse } from "next/server";
import { EPS_CDN_CACHE_CONTROL, getEpsHistory, parseSymbolsFromRequest } from "@/lib/api/earningsHistory";
import type { EpsHistoryPoint } from "@/types/api";

type BatchPayload = Record<string, EpsHistoryPoint[]>;

export async function GET(request: Request) {
  const symbols = parseSymbolsFromRequest(new URL(request.url));
  if (symbols.length === 0) {
    return NextResponse.json({} satisfies BatchPayload, {
      headers: {
        "Cache-Control": EPS_CDN_CACHE_CONTROL,
        "x-eps-cache": "MISS",
        "x-eps-source": "yahoo-quoteSummary",
        "x-eps-batch-count": "0",
      },
    });
  }

  const responses = await Promise.all(symbols.map((symbol) => getEpsHistory(symbol)));
  const payload: BatchPayload = {};
  let hits = 0;
  let misses = 0;
  let stale = 0;
  let errors = 0;

  for (const row of responses) {
    payload[row.symbol] = row.data;
    if (row.cache === "HIT") hits += 1;
    if (row.cache === "MISS") misses += 1;
    if (row.cache === "STALE") stale += 1;
    if (row.cache === "ERROR") errors += 1;
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": EPS_CDN_CACHE_CONTROL,
      "x-eps-cache": errors > 0 ? "PARTIAL" : misses > 0 ? "MISS" : "HIT",
      "x-eps-source": "yahoo-quoteSummary",
      "x-eps-batch-count": String(symbols.length),
      "x-eps-batch-hit": String(hits),
      "x-eps-batch-miss": String(misses),
      "x-eps-batch-stale": String(stale),
      "x-eps-batch-error": String(errors),
    },
  });
}
