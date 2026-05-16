import { NextRequest } from "next/server";
import { getFinancialJuiceChangesSince, getFinancialJuiceSequence, getFinancialJuiceSnapshot } from "@/lib/news/liveFinancialJuiceStore";
import { MARKET_KEYWORDS, normalizeMarket } from "@/lib/market";
import type { MarketKey } from "@/types";

export const dynamic = "force-dynamic";
const FULL_DAY_MS = 24 * 60 * 60 * 1000;
const STREAM_LIMIT = Number(process.env.FINANCIAL_JUICE_STREAM_LIMIT ?? 500);

const filterByMarket = (headline: string, category: string, market: MarketKey) => {
  if (market === "forex") return true;
  const haystack = `${headline} ${category}`.toLowerCase();
  const keywordMarket: Exclude<MarketKey, "forex" | "stocks"> = market === "stocks" ? "commodities" : market;
  const keywords = MARKET_KEYWORDS[keywordMarket];
  return keywords.some((keyword) => haystack.includes(keyword));
};

const isWithinLast24Hours = (publishedAt: string | undefined, nowMs: number) => {
  if (!publishedAt) return false;
  const publishedMs = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedMs)) return false;
  return publishedMs >= nowMs - FULL_DAY_MS && publishedMs <= nowMs;
};

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastSequence = getFinancialJuiceSequence();

      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const nowMs = Date.now();
      const initialSnapshot = getFinancialJuiceSnapshot(STREAM_LIMIT).filter(
        (row) => filterByMarket(row.headline, row.category, market) && isWithinLast24Hours(row.publishedAt, nowMs)
      );
      send({
        type: "snapshot",
        source: "financialjuice-telegram-live",
        items: initialSnapshot,
      });

      const interval = setInterval(() => {
        const { sequence, items } = getFinancialJuiceChangesSince(lastSequence, STREAM_LIMIT);

        if (sequence !== lastSequence) {
          lastSequence = sequence;
          const intervalNowMs = Date.now();
          const filtered = items.filter(
            (row) => filterByMarket(row.headline, row.category, market) && isWithinLast24Hours(row.publishedAt, intervalNowMs)
          );

          if (filtered.length > 0) {
            send({
              type: "update",
              source: "financialjuice-telegram-live",
              items: filtered,
              sequence,
            });
          }
        }
      }, 1500);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 20000);

      const close = () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
