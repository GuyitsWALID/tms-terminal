import * as cheerio from "cheerio";
import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizeText, safeId, type CacheRecord } from "@/lib/api/scraperUtils";

export type CalendarImpact = "high" | "medium" | "low";

export type MonthCalendarRow = {
  id: string;
  dateKey: string;
  time: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: CalendarImpact;
  isStarred: boolean;
};

type JobState = {
  status: "idle" | "running" | "completed" | "failed";
  startedAt?: number;
  endedAt?: number;
  lastSuccessAt?: number;
  lastError?: string;
  rowCount: number;
};

const MONTH_CACHE = new Map<string, CacheRecord<MonthCalendarRow[]>>();
const MONTH_JOB_STATE = new Map<string, JobState>();
const ACTIVE_JOBS = new Set<string>();
const MONTH_JOB_CACHE_DIR = path.join(process.cwd(), ".next", "cache", "calendar-month-jobs");

const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const monthMap = new Map([
  ["jan", 1],
  ["feb", 2],
  ["mar", 3],
  ["apr", 4],
  ["may", 5],
  ["jun", 6],
  ["jul", 7],
  ["aug", 8],
  ["sep", 9],
  ["oct", 10],
  ["nov", 11],
  ["dec", 12],
]);

const parseImpact = (raw: string): CalendarImpact => {
  const lower = raw.toLowerCase();
  if (/(high|red|icon--ff-impact-red)/.test(lower)) return "high";
  if (/(medium|orange|icon--ff-impact-ora)/.test(lower)) return "medium";
  return "low";
};

const toTwoDigits = (value: string | number) => String(Number(value)).padStart(2, "0");

const toDateKey = (year: number, month: number, day: number) => `${toTwoDigits(month)}-${toTwoDigits(day)}-${year}`;

const toForexFactoryDayParam = (year: number, month: number, day: number) => {
  const monthIndex = Math.max(0, Math.min(11, month - 1));
  return `${monthAbbr[monthIndex]}${day}.${year}`;
};

const parseDateLabelToKey = (label: string, fallbackYear: number): string | null => {
  const cleaned = normalizeText(label).replace(/,/g, " ");
  const match = cleaned.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})(?:\s+(\d{4}))?/i);
  if (!match) return null;

  const [, mon, dayRaw, yearRaw] = match;
  const month = monthMap.get(mon.toLowerCase());
  const day = Number(dayRaw);
  const year = yearRaw ? Number(yearRaw) : fallbackYear;

  if (!month || !day || !year) return null;
  return toDateKey(year, month, day);
};

const parseForexFactoryMonthPage = (html: string, year: number, month: number): MonthCalendarRow[] => {
  const $ = cheerio.load(html);
  const rows = $("tr.calendar__row, .calendar__row");

  const parsedRows: MonthCalendarRow[] = [];
  let carryDateKey: string | null = null;
  let carryTime = "All Day";
  let carryCurrency = "N/A";

  rows.each((index, element) => {
    const row = $(element);

    const dateText = normalizeText(
      row
        .find(".calendar__date, td.calendar__date, [class*='calendar__date']")
        .first()
        .text()
    );

    if (dateText) {
      const parsedDateKey = parseDateLabelToKey(dateText, year);
      if (parsedDateKey) carryDateKey = parsedDateKey;
    }

    const rawTime = normalizeText(
      row
        .find(".calendar__time, td.calendar__time, [class*='calendar__time']")
        .first()
        .text()
    );

    const rawCurrency = normalizeText(
      row
        .find(".calendar__currency, td.calendar__currency, [class*='calendar__currency']")
        .first()
        .text()
    );

    const eventName = normalizeText(
      row
        .find(
          ".calendar__event-title, .calendar__event, td.calendar__event, [class*='calendar__event'] a, [class*='calendar__event'] span"
        )
        .first()
        .text()
    );

    if (rawTime) carryTime = rawTime;
    if (rawCurrency) carryCurrency = rawCurrency;

    if (!eventName || !carryDateKey || !carryCurrency || carryCurrency === "N/A") return;

    const dateParts = carryDateKey.split("-").map(Number);
    if (dateParts.length !== 3) return;

    const [eventMonth, , eventYear] = dateParts;
    if (eventYear !== year || eventMonth !== month) return;

    const impactText = `${row.find(".calendar__impact, [class*='calendar__impact']").attr("class") ?? ""} ${normalizeText(
      row.find(".calendar__impact, [class*='calendar__impact']").text()
    )}`;

    parsedRows.push({
      id: safeId(`${carryCurrency}-${eventName}-${carryDateKey}-${carryTime}`, index),
      dateKey: carryDateKey,
      time: carryTime || "All Day",
      currency: carryCurrency,
      event: eventName,
      actual: normalizeText(row.find(".calendar__actual, td.calendar__actual, [class*='calendar__actual']").first().text()) || "-",
      forecast: normalizeText(row.find(".calendar__forecast, td.calendar__forecast, [class*='calendar__forecast']").first().text()) || "-",
      previous: normalizeText(row.find(".calendar__previous, td.calendar__previous, [class*='calendar__previous']").first().text()) || "-",
      impact: parseImpact(impactText),
      isStarred: false,
    });
  });

  return parsedRows;
};

const parseForexFactoryDayPage = (html: string, year: number, month: number, day: number): MonthCalendarRow[] => {
  const $ = cheerio.load(html);
  const rows = $("tr.calendar__row, .calendar__row");

  const parsedRows: MonthCalendarRow[] = [];
  let carryTime = "All Day";
  let carryCurrency = "N/A";
  const dateKey = toDateKey(year, month, day);

  rows.each((index, element) => {
    const row = $(element);

    const rawTime = normalizeText(
      row
        .find(".calendar__time, td.calendar__time, [class*='calendar__time']")
        .first()
        .text()
    );

    const rawCurrency = normalizeText(
      row
        .find(".calendar__currency, td.calendar__currency, [class*='calendar__currency']")
        .first()
        .text()
    );

    const eventName = normalizeText(
      row
        .find(
          ".calendar__event-title, .calendar__event, td.calendar__event, [class*='calendar__event'] a, [class*='calendar__event'] span"
        )
        .first()
        .text()
    );

    if (rawTime) carryTime = rawTime;
    if (rawCurrency) carryCurrency = rawCurrency;

    if (!eventName || !carryCurrency || carryCurrency === "N/A") return;

    const impactText = `${row.find(".calendar__impact, [class*='calendar__impact']").attr("class") ?? ""} ${normalizeText(
      row.find(".calendar__impact, [class*='calendar__impact']").text()
    )}`;

    parsedRows.push({
      id: safeId(`${carryCurrency}-${eventName}-${dateKey}-${carryTime}`, index),
      dateKey,
      time: carryTime || "All Day",
      currency: carryCurrency,
      event: eventName,
      actual: normalizeText(row.find(".calendar__actual, td.calendar__actual, [class*='calendar__actual']").first().text()) || "-",
      forecast: normalizeText(row.find(".calendar__forecast, td.calendar__forecast, [class*='calendar__forecast']").first().text()) || "-",
      previous: normalizeText(row.find(".calendar__previous, td.calendar__previous, [class*='calendar__previous']").first().text()) || "-",
      impact: parseImpact(impactText),
      isStarred: false,
    });
  });

  return parsedRows;
};

const dedupeRows = (rows: MonthCalendarRow[]) => {
  const seen = new Set<string>();
  const deduped: MonthCalendarRow[] = [];

  for (const row of rows) {
    const key = `${row.dateKey}|${row.time}|${row.currency}|${row.event}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
};

const countUniqueDays = (rows: MonthCalendarRow[]) => new Set(rows.map((row) => row.dateKey)).size;

const hasSufficientCoverage = (rows: MonthCalendarRow[], year: number, month: number) => {
  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const uniqueDays = countUniqueDays(rows);
  return uniqueDays >= Math.min(20, totalDaysInMonth);
};

const scrapeSingleDayWithFreshBrowser = async (year: number, month: number, day: number): Promise<MonthCalendarRow[]> => {
  const playwright = await import("playwright");
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1600, height: 1200 },
    });

    const page = await context.newPage();
    const dayParam = toForexFactoryDayParam(year, month, day);
    const dayUrl = `https://www.forexfactory.com/calendar?day=${dayParam}`;

    await page.goto(dayUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    const title = await page.title();
    if (/just a moment/i.test(title)) return [];

    const html = await page.content();
    return parseForexFactoryDayPage(html, year, month, day);
  } catch {
    return [];
  } finally {
    await browser.close();
  }
};

const launchBrowserAndScrapeMonth = async (year: number, month: number) => {
  const monthParam = monthAbbr[Math.max(0, month - 1)] ?? monthAbbr[new Date().getUTCMonth()];
  const monthUrl = "https://www.forexfactory.com/calendar?month=this";

  const playwright = await import("playwright");
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1600, height: 1200 },
    });

    const page = await context.newPage();
    await page.goto(monthUrl, { waitUntil: "domcontentloaded", timeout: 90000 });

    try {
      await page.waitForSelector("tr.calendar__row", { timeout: 25000 });
    } catch {
      // Let parser decide if content is valid.
    }

    const title = await page.title();

    if (/just a moment/i.test(title)) {
      throw new Error("Cloudflare challenge page returned by ForexFactory");
    }

    // Mirror manual behavior: open month picker and jump to requested month.
    try {
      await page.click(".calendarmini__header-date", { timeout: 4000 });
      await page.click(`a.calendarmini__shortcut[href*='month=${monthParam}.${year}']`, { timeout: 4000 });
      try {
        await page.waitForSelector("tr.calendar__row", { timeout: 12000 });
      } catch {
        // Continue; protected page may still expose partial HTML for parsing.
      }
    } catch {
      // Fallback to direct month URL if the shortcuts path is unavailable.
      await page.goto(`https://www.forexfactory.com/calendar?month=${monthParam}.${year}`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      try {
        await page.waitForSelector("tr.calendar__row", { timeout: 12000 });
      } catch {
        // Continue to parse whatever markup is returned.
      }
    }

    const html = await page.content();

    const monthRows = parseForexFactoryMonthPage(html, year, month);

    const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dayByDayRows: MonthCalendarRow[] = [];

    for (let day = 1; day <= totalDaysInMonth; day += 1) {
      const parsedDayRows = await scrapeSingleDayWithFreshBrowser(year, month, day);
      if (parsedDayRows.length > 0) {
        dayByDayRows.push(...parsedDayRows);
      }
    }

    const combinedRows = dedupeRows([...dayByDayRows, ...monthRows]);

    if (!combinedRows.length) {
      throw new Error("Monthly parser returned no rows");
    }

    const uniqueDays = countUniqueDays(combinedRows);
    if (uniqueDays < Math.min(20, totalDaysInMonth)) {
      throw new Error(`Monthly scrape incomplete: only ${uniqueDays}/${totalDaysInMonth} days captured`);
    }

    return combinedRows;
  } finally {
    await browser.close();
  }
};

export const getMonthJobCacheKey = (year: number, month: number) => `${year}-${toTwoDigits(month)}`;

const getMonthCacheFilePath = (year: number, month: number) => path.join(MONTH_JOB_CACHE_DIR, `${getMonthJobCacheKey(year, month)}.json`);

const persistMonthCacheToDisk = async (year: number, month: number, record: CacheRecord<MonthCalendarRow[]>) => {
  await fs.mkdir(MONTH_JOB_CACHE_DIR, { recursive: true });
  await fs.writeFile(getMonthCacheFilePath(year, month), JSON.stringify(record), "utf8");
};

const readMonthCacheFromDisk = async (year: number, month: number): Promise<CacheRecord<MonthCalendarRow[]> | null> => {
  try {
    const raw = await fs.readFile(getMonthCacheFilePath(year, month), "utf8");
    const parsed = JSON.parse(raw) as CacheRecord<MonthCalendarRow[]>;
    if (!parsed || !Array.isArray(parsed.data)) return null;
    if (parsed.expiresAt <= Date.now()) return null;
    if (!hasSufficientCoverage(parsed.data, year, month)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getMonthJobCachedRows = async (year: number, month: number) => {
  const key = getMonthJobCacheKey(year, month);
  const cacheRecord = MONTH_CACHE.get(key);
  if (cacheRecord && cacheRecord.expiresAt > Date.now()) {
    if (hasSufficientCoverage(cacheRecord.data, year, month)) return cacheRecord;
    MONTH_CACHE.delete(key);
  }

  const diskRecord = await readMonthCacheFromDisk(year, month);
  if (!diskRecord) return null;

  MONTH_CACHE.set(key, diskRecord);
  return diskRecord;
};

export const getMonthJobState = (year: number, month: number): JobState => {
  const key = getMonthJobCacheKey(year, month);
  return (
    MONTH_JOB_STATE.get(key) ?? {
      status: "idle",
      rowCount: 0,
    }
  );
};

const setState = (year: number, month: number, patch: Partial<JobState>) => {
  const key = getMonthJobCacheKey(year, month);
  const current = getMonthJobState(year, month);
  MONTH_JOB_STATE.set(key, {
    ...current,
    ...patch,
  });
};

export const runMonthScrapeJob = async (year: number, month: number) => {
  const key = getMonthJobCacheKey(year, month);
  if (ACTIVE_JOBS.has(key)) return false;

  ACTIVE_JOBS.add(key);
  setState(year, month, {
    status: "running",
    startedAt: Date.now(),
    endedAt: undefined,
    lastError: undefined,
  });

  try {
    const rows = await launchBrowserAndScrapeMonth(year, month);
    MONTH_CACHE.set(key, {
      data: rows,
      source: "forexfactory-playwright-month",
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    const record = MONTH_CACHE.get(key);
    if (record) {
      await persistMonthCacheToDisk(year, month, record);
    }

    setState(year, month, {
      status: "completed",
      endedAt: Date.now(),
      lastSuccessAt: Date.now(),
      rowCount: rows.length,
      lastError: undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown month scrape error";
    setState(year, month, {
      status: "failed",
      endedAt: Date.now(),
      lastError: message,
    });
  } finally {
    ACTIVE_JOBS.delete(key);
  }

  return true;
};

export const triggerMonthScrapeJob = (year: number, month: number) => {
  void runMonthScrapeJob(year, month);
};
