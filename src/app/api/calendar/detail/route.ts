import { NextRequest, NextResponse } from "next/server";
import {
  ensureDetailFallback,
  hasDetailContent,
  scrapeForexFactoryDetailByEventId,
  type ForexFactoryDetail,
} from "@/lib/api/forexFactoryDetail";
import { getMonthJobCachedRows } from "@/lib/api/calendarMonthJob";

export const runtime = "nodejs";

type EventDetailPayload = ForexFactoryDetail;

type CacheRecord = {
  data: EventDetailPayload;
  expiresAt: number;
};

const DETAIL_CACHE = new Map<string, CacheRecord>();
const CDN_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=1800";

const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

const readFromCurrentMonthCache = async (eventId: string) => {
  const now = new Date();
  const monthCache = await getMonthJobCachedRows(now.getUTCFullYear(), now.getUTCMonth() + 1);
  if (!monthCache?.data?.length) return null;

  const matched = monthCache.data.find((row) => row.detailId === eventId && hasDetailContent(row.scrapedDetail));
  return matched?.scrapedDetail ?? null;
};

export async function GET(request: NextRequest) {
  const eventId = normalize(request.nextUrl.searchParams.get("event_id"));
  if (!eventId) {
    return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
  }

  const cached = DETAIL_CACHE.get(eventId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": CDN_CACHE_CONTROL,
        "x-calendar-detail-cache": "HIT",
      },
    });
  }

  try {
    const cachedMonthDetail = await readFromCurrentMonthCache(eventId);
    const scraped = cachedMonthDetail ?? (await scrapeForexFactoryDetailByEventId(eventId)) ?? {};
    const detail = ensureDetailFallback(scraped);
    DETAIL_CACHE.set(eventId, {
      data: detail,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": CDN_CACHE_CONTROL,
        "x-calendar-detail-cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json(
      {
        source: "Detail scrape unavailable right now.",
        whyTradersCare: "Detailed context could not be scraped from source at this moment.",
      } satisfies EventDetailPayload,
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "x-calendar-detail-cache": "MISS",
        },
      }
    );
  }
}
