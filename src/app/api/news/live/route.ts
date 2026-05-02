import { NextRequest } from "next/server";
import { getFinancialJuiceChangesSince, getFinancialJuiceSequence, getFinancialJuiceSnapshot } from "@/lib/news/liveFinancialJuiceStore";
import { MARKET_KEYWORDS, normalizeMarket } from "@/lib/market";
import type { MarketKey } from "@/types";

export const dynamic = "force-dynamic";

const filterByMarket = (headline: string, category: string, market: MarketKey) => {
  if (market === "forex") return true;
  const haystack = `${headline} ${category}`.toLowerCase();
  const keywordMarket: Exclude<MarketKey, "forex" | "stocks"> = market === "stocks" ? "commodities" : market;
  const keywords = MARKET_KEYWORDS[keywordMarket];
  return keywords.some((keyword) => haystack.includes(keyword));
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

      const initialSnapshot = getFinancialJuiceSnapshot(30).filter((row) => filterByMarket(row.headline, row.category, market));
      send({
        type: "snapshot",
        source: "financialjuice-telegram-live",
        items: initialSnapshot,
      });

      const interval = setInterval(() => {
        const { sequence, items } = getFinancialJuiceChangesSince(lastSequence, 30);

        if (sequence !== lastSequence) {
          lastSequence = sequence;
          const filtered = items.filter((row) => filterByMarket(row.headline, row.category, market));

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
