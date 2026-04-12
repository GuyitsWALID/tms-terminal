export const SCRAPER_TTL_MS = 5 * 60 * 1000;

const BULLISH_WORDS = ["hike", "growth", "strong", "bullish", "surge", "outperform", "gain", "support", "beat", "expands"];
const BEARISH_WORDS = ["cut", "drop", "weak", "bearish", "collapse", "underperform", "loss", "slide", "miss", "contracts"];

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
};

export type CacheRecord<T> = {
  data: T;
  expiresAt: number;
  source: string;
  createdAt: number;
};

export const isCacheFresh = <T>(entry: CacheRecord<T> | undefined) => {
  if (!entry) return false;
  return entry.expiresAt > Date.now();
};

export const makeCacheRecord = <T>(data: T, source: string): CacheRecord<T> => ({
  data,
  source,
  createdAt: Date.now(),
  expiresAt: Date.now() + SCRAPER_TTL_MS,
});

export const normalizeText = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim();

export const analyzeSentiment = (headline: string): { sentiment: "bullish" | "bearish" | "neutral"; score: number } => {
  const lower = headline.toLowerCase();
  let score = 0;

  for (const word of BULLISH_WORDS) {
    if (lower.includes(word)) score += 0.2;
  }
  for (const word of BEARISH_WORDS) {
    if (lower.includes(word)) score -= 0.2;
  }

  const bounded = Math.max(-1, Math.min(1, Number(score.toFixed(2))));
  if (bounded > 0.2) return { sentiment: "bullish", score: bounded };
  if (bounded < -0.2) return { sentiment: "bearish", score: bounded };
  return { sentiment: "neutral", score: bounded };
};

export const inferImpactFromText = (input: string): "high" | "medium" | "low" => {
  const raw = input.toLowerCase();
  if (/(high|red|breaking|rate|cpi|nfp|fomc)/.test(raw)) return "high";
  if (/(medium|orange|pmi|employment|sales|speech)/.test(raw)) return "medium";
  return "low";
};

export const safeId = (seed: string, index: number) => {
  const compact = seed
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 48);
  return compact ? `${compact}-${index}` : `item-${index}`;
};

export const fetchWithTimeout = async (url: string, timeoutMs = 12000, headers?: Record<string, string>) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...DEFAULT_HEADERS,
        ...(headers ?? {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
};
