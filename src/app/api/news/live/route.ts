import { NextRequest } from "next/server";
import { getFinancialJuiceChangesSince, getFinancialJuiceSequence, getFinancialJuiceSnapshot } from "@/lib/news/liveFinancialJuiceStore";
import { MARKET_KEYWORDS, normalizeMarket } from "@/lib/market";
import type { MarketKey } from "@/types";

export const dynamic = "force-dynamic";
const FULL_DAY_MS = 24 * 60 * 60 * 1000;
const STREAM_LIMIT = Number(process.env.FINANCIAL_JUICE_STREAM_LIMIT ?? 500);
const SESSION_MAX_MS = Number(process.env.FINANCIAL_JUICE_SSE_SESSION_MS ?? 60_000);
const UPDATE_INTERVAL_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 20_000;

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
  const sessionId = crypto.randomUUID();
  const sessionStartedAt = Date.now();
  const sessionClass = SESSION_MAX_MS <= 45_000 ? "short" : SESSION_MAX_MS <= 90_000 ? "balanced" : "long";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastSequence = getFinancialJuiceSequence();
      let closed = false;

      const send = (payload: unknown) => {
        if (closed) return;
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
        sessionId,
        sequence: lastSequence,
      });

      const interval = setInterval(() => {
        if (closed) return;
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
              sessionId,
            });
          }
        }
      }, UPDATE_INTERVAL_MS);

      const heartbeat = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, HEARTBEAT_INTERVAL_MS);

      const sessionTimer = setTimeout(() => {
        send({
          type: "reconnect",
          reason: "session-ttl",
          sessionId,
          sequence: lastSequence,
        });
        close("session-ttl");
      }, SESSION_MAX_MS);

      const close = (reason: "abort" | "session-ttl" | "internal") => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        clearTimeout(sessionTimer);
        request.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // Ignore close races when client disconnects first.
        }
        console.log("[financialjuice-live] session closed", {
          sessionId,
          reason,
          durationMs: Date.now() - sessionStartedAt,
          market,
        });
      };

      const onAbort = () => close("abort");
      request.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Live-Session-Class": sessionClass,
      "X-Live-Session-Max-Ms": String(SESSION_MAX_MS),
      "X-Live-Session-Id": sessionId,
    },
  });
}
