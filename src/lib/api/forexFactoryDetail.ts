import * as cheerio from "cheerio";

export type ForexFactoryDetail = {
  source?: string;
  usualEffect?: string;
  frequency?: string;
  nextRelease?: string;
  ffNotes?: string;
  whyTradersCare?: string;
  items?: Array<{
    title: string;
    value: string;
  }>;
};

const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

const normalizeLabel = (value: string | null | undefined) => normalize(value).replace(/\s+/g, " ").toLowerCase();

const cleanTitle = (value: string | null | undefined) => {
  const text = cheerio.load(`<div>${value ?? ""}</div>`)("div").text();
  return normalize(text.replace(/:+$/g, "").replace(/\s+/g, " "));
};

const cleanValue = (value: string | null | undefined) => {
  const text = cheerio.load(`<div>${value ?? ""}</div>`)("div").text();
  return normalize(text);
};

const isNoisyValue = (value: string) => {
  const lower = value.toLowerCase();
  return lower.includes('"html":') || lower.includes('"history":') || lower.includes('"linked_threads"');
};

const parseSpecsFromJson = (raw: string): Array<{ title: string; value: string }> => {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const pushSpecs = (payload: unknown) => {
    const specs =
      payload && typeof payload === "object" && "specs" in payload
        ? (payload as { specs?: unknown }).specs
        : undefined;

    if (!Array.isArray(specs)) return [] as Array<{ title: string; value: string }>;

    return specs
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const row = entry as { title?: unknown; html?: unknown; text?: unknown };
        const title = cleanTitle(typeof row.title === "string" ? row.title : "");
        const value = cleanValue(typeof row.html === "string" ? row.html : typeof row.text === "string" ? row.text : "");
        if (!title || !value || isNoisyValue(value)) return null;
        return { title, value };
      })
      .filter((item): item is { title: string; value: string } => Boolean(item));
  };

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const rows = pushSpecs(parsed);
    if (rows.length > 0) return rows;
  } catch {
    // Continue to regex-based extraction.
  }

  const specsMatch = trimmed.match(/"specs"\s*:\s*(\[[\s\S]*?\])\s*,\s*"history"/i);
  if (!specsMatch?.[1]) return [];

  try {
    const parsed = JSON.parse(`{"specs":${specsMatch[1]}}`) as { specs?: unknown };
    return pushSpecs(parsed);
  } catch {
    return [];
  }
};

const parseCookieHeader = (cookieHeader: string) => {
  return cookieHeader
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const index = pair.indexOf("=");
      if (index <= 0) return null;
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (!name || !value) return null;
      return { name, value };
    })
    .filter((item): item is { name: string; value: string } => Boolean(item));
};

export const hasDetailContent = (detail: ForexFactoryDetail | null | undefined) =>
  Boolean(
    detail && (detail.source || detail.usualEffect || detail.frequency || detail.nextRelease || detail.ffNotes || detail.whyTradersCare || detail.items?.length)
  );

export const ensureDetailFallback = (detail: ForexFactoryDetail): ForexFactoryDetail => {
  if (hasDetailContent(detail)) return detail;
  return {
    source: "Detail scrape unavailable right now.",
    whyTradersCare: "The source detail panel is currently protected or unavailable.",
  };
};

const extractByLabel = (text: string, label: string, nextLabels: string[]) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const next = nextLabels.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const rx = new RegExp(`${escaped}\\s*([\\s\\S]*?)(?=${next}|$)`, "i");
  const match = text.match(rx);
  return normalize(match?.[1]);
};

export const parseDetailFromHtml = (html: string): ForexFactoryDetail => {
  const jsonSpecs = parseSpecsFromJson(html);

  const $ = cheerio.load(html);
  const text = normalize($.text().replace(/\r/g, ""));

  const specs = new Map<string, string>();

  for (const item of jsonSpecs) {
    specs.set(normalizeLabel(item.title), item.value);
  }

  $("table tr").each((_, tr) => {
    const cells = $(tr).find("th, td");
    if (cells.length < 2) return;

    const label = normalizeLabel(cleanTitle($(cells[0]).html() ?? $(cells[0]).text()));
    const value = cleanValue($(cells[1]).html() ?? $(cells[1]).text());
    if (!label || !value) return;
    if (!specs.has(label)) specs.set(label, value);
  });

  const fromSpecs = (labels: string[]) => {
    for (const label of labels) {
      const value = specs.get(label);
      if (value) return value;
    }
    return "";
  };

  const source =
    fromSpecs(["source"]) ||
    normalize($("[data-field='source'], .calendar_detail_source, .detail-source").first().text()) ||
    extractByLabel(text, "Source", ["Usual Effect", "Frequency", "Next Release", "FF Notes", "Why Traders Care"]);

  const usualEffect =
    fromSpecs(["usual effect"]) ||
    normalize($("[data-field='usual-effect'], .calendar_detail_usual_effect, .detail-usual-effect").first().text()) ||
    extractByLabel(text, "Usual Effect", ["Frequency", "Next Release", "FF Notes", "Why Traders Care"]);

  const frequency =
    fromSpecs(["frequency"]) ||
    normalize($("[data-field='frequency'], .calendar_detail_frequency, .detail-frequency").first().text()) ||
    extractByLabel(text, "Frequency", ["Next Release", "FF Notes", "Why Traders Care"]);

  const nextRelease =
    fromSpecs(["next release"]) ||
    normalize($("[data-field='next-release'], .calendar_detail_next_release, .detail-next-release").first().text()) ||
    extractByLabel(text, "Next Release", ["FF Notes", "Why Traders Care"]);

  const ffNotes =
    fromSpecs(["ff notes"]) ||
    normalize($("[data-field='ff-notes'], .calendar_detail_ff_notes, .detail-ff-notes").first().text()) ||
    extractByLabel(text, "FF Notes", ["Why Traders Care"]);

  const whyTradersCare =
    fromSpecs(["why traders care", "why traders care "]) ||
    normalize($("[data-field='why-traders-care'], .calendar_detail_why_traders_care, .detail-why-traders-care").first().text()) ||
    extractByLabel(text, "Why Traders Care", ["View full details", "Related Stories", "Date"]);

  const dynamicItems = Array.from(specs.entries())
    .map(([title, value]) => ({ title: cleanTitle(title), value: cleanValue(value) }))
    .filter((item) => item.title && item.value && !isNoisyValue(item.value));

  return {
    source: source || undefined,
    usualEffect: usualEffect || undefined,
    frequency: frequency || undefined,
    nextRelease: nextRelease || undefined,
    ffNotes: ffNotes || undefined,
    whyTradersCare: whyTradersCare || undefined,
    items: dynamicItems.length > 0 ? dynamicItems : undefined,
  };
};

const buildDetailUrls = (rawEventId: string, siteId: number) => {
  const eventId = normalize(rawEventId);
  if (!eventId) return [];

  if (/^https?:\/\//i.test(eventId)) {
    return [eventId];
  }

  if (eventId.includes("/calendar/details/")) {
    return [`https://www.forexfactory.com${eventId.startsWith("/") ? "" : "/"}${eventId}`];
  }

  if (/^\d+-/.test(eventId)) {
    return [`https://www.forexfactory.com/calendar/details/${eventId}`];
  }

  if (/^\d+$/.test(eventId)) {
    return [
      `https://www.forexfactory.com/calendar/details/${siteId}-${eventId}`,
      `https://www.forexfactory.com/calendar/details/${eventId}`,
    ];
  }

  return [`https://www.forexfactory.com/calendar/details/${eventId}`];
};

const isChallengeResponse = (html: string) => {
  const lower = html.toLowerCase();
  return (
    lower.includes("just a moment") ||
    lower.includes("cf-challenge") ||
    lower.includes("cloudflare") ||
    lower.includes("attention required")
  );
};

export const scrapeForexFactoryDetails = async (
  eventIds: string[],
  options?: {
    siteId?: number;
    maxConcurrency?: number;
  }
) => {
  const cleanedIds = Array.from(new Set(eventIds.map((id) => normalize(id)).filter(Boolean)));
  const result = new Map<string, ForexFactoryDetail>();
  if (cleanedIds.length === 0) return result;

  const playwright = await import("playwright");
  const cookieHeader = normalize(process.env.FOREX_FACTORY_COOKIE);
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const siteId = options?.siteId ?? 1;
  const maxConcurrency = Math.max(1, Math.min(options?.maxConcurrency ?? 4, 8));

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1600, height: 1200 },
    });

    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader).map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: ".forexfactory.com",
        path: "/",
        httpOnly: false,
        secure: true,
      }));

      if (cookies.length > 0) {
        await context.addCookies(cookies);
      }
    }

    // Prime cookies/session before detail calls.
    const primer = await context.newPage();
    try {
      await primer.goto("https://www.forexfactory.com/calendar?month=this", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
    } catch {
      // Best effort only.
    }
    await primer.close();

    let cursor = 0;

    const worker = async () => {
      while (cursor < cleanedIds.length) {
        const index = cursor;
        cursor += 1;
        const eventId = cleanedIds[index];
        const urls = buildDetailUrls(eventId, siteId);
        if (urls.length === 0) continue;

        try {
          let resolved = false;

          for (const url of urls) {
            const response = await context.request.get(url, {
              timeout: 15000,
              headers: {
                Referer: "https://www.forexfactory.com/calendar?month=this",
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
              },
            });

            if (!response.ok()) continue;

            const html = await response.text();
            if (!html || isChallengeResponse(html)) continue;

            const parsed = parseDetailFromHtml(html);
            if (hasDetailContent(parsed)) {
              result.set(eventId, parsed);
              resolved = true;
              break;
            }
          }

          if (resolved) continue;

          const page = await context.newPage();
          try {
            for (const url of urls) {
              await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
              const html = await page.content();
              if (!html || isChallengeResponse(html)) continue;

              const parsed = parseDetailFromHtml(html);
              if (hasDetailContent(parsed)) {
                result.set(eventId, parsed);
                break;
              }
            }
          } finally {
            await page.close();
          }
        } catch {
          // Best effort for bulk detail enrichment.
        }
      }
    };

    await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));
    await context.close();
  } finally {
    await browser.close();
  }

  return result;
};

export const scrapeForexFactoryDetailByEventId = async (eventId: string) => {
  const detailMap = await scrapeForexFactoryDetails([eventId], { maxConcurrency: 1 });
  return detailMap.get(eventId);
};
