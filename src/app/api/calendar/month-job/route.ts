import { NextRequest, NextResponse } from "next/server";
import { getMonthJobCachedRows, getMonthJobState, runMonthScrapeJob, triggerMonthScrapeJob } from "@/lib/api/calendarMonthJob";

export const runtime = "nodejs";

const parseYearMonth = (request: NextRequest) => {
  const now = new Date();
  const search = request.nextUrl.searchParams;

  const year = Number(search.get("year") ?? now.getUTCFullYear());
  const month = Number(search.get("month") ?? now.getUTCMonth() + 1);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
};

export async function GET(request: NextRequest) {
  const parsed = parseYearMonth(request);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }

  const { year, month } = parsed;
  const state = getMonthJobState(year, month);
  const cache = await getMonthJobCachedRows(year, month);

  return NextResponse.json({
    year,
    month,
    state,
    hasCache: Boolean(cache),
    cachedRows: cache?.data.length ?? 0,
    cacheCreatedAt: cache?.createdAt ?? null,
    cacheExpiresAt: cache?.expiresAt ?? null,
  });
}

export async function POST(request: NextRequest) {
  const parsed = parseYearMonth(request);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }

  const { year, month } = parsed;
  const wait = request.nextUrl.searchParams.get("wait") === "1";

  if (wait) {
    await runMonthScrapeJob(year, month);
    const state = getMonthJobState(year, month);
    const cache = await getMonthJobCachedRows(year, month);

    return NextResponse.json({
      year,
      month,
      state,
      hasCache: Boolean(cache),
      cachedRows: cache?.data.length ?? 0,
      cacheCreatedAt: cache?.createdAt ?? null,
      cacheExpiresAt: cache?.expiresAt ?? null,
    });
  }

  triggerMonthScrapeJob(year, month);
  return NextResponse.json({
    status: "started",
    year,
    month,
  });
}
