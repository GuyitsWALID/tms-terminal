import * as cheerio from "cheerio";

const TELEGRAM_CHANNEL_URL = process.env.FINANCIAL_JUICE_TELEGRAM_URL ?? "https://t.me/s/FinancialJuice";
const INGEST_URL = process.env.FINANCIAL_JUICE_INGEST_URL;
const INGEST_KEY = process.env.FINANCIAL_JUICE_INGEST_KEY;
const POLL_MS = Number(process.env.FINANCIAL_JUICE_POLL_MS ?? 4000);

if (!INGEST_URL || !INGEST_KEY) {
  console.error("Missing FINANCIAL_JUICE_INGEST_URL or FINANCIAL_JUICE_INGEST_KEY");
  process.exit(1);
}

let lastSeenPostId = "";

const extractTelegramPosts = (html) => {
  const $ = cheerio.load(html);
  const rows = [];

  $(".tgme_widget_message_wrap").each((index, element) => {
    const row = $(element);
    const postLink = row.find(".tgme_widget_message_date").attr("href") || "";
    const postId = postLink.split("/").pop() || "";
    const text = row.find(".tgme_widget_message_text").text().replace(/\s+/g, " ").trim();
    const timeNode = row.find("time").first();
    const datetime = timeNode.attr("datetime") || new Date().toISOString();

    if (!postId || !text) return;

    rows.push({
      sourcePostId: postId,
      text,
      publishedAt: datetime,
      url: postLink,
      category: "Live Wire",
      order: index,
    });
  });

  return rows.sort((a, b) => Number(a.sourcePostId) - Number(b.sourcePostId));
};

const pushIngest = async (items) => {
  const response = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-financial-juice-key": INGEST_KEY,
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ingest failed (${response.status}): ${body}`);
  }

  return response.json();
};

const pollOnce = async () => {
  const response = await fetch(TELEGRAM_CHANNEL_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Telegram fetch failed (${response.status})`);
  }

  const html = await response.text();
  const posts = extractTelegramPosts(html);
  if (posts.length === 0) return;

  if (!lastSeenPostId) {
    lastSeenPostId = posts[posts.length - 1].sourcePostId;
    console.log(`Initialized checkpoint at post ${lastSeenPostId}`);
    return;
  }

  const fresh = posts.filter((post) => Number(post.sourcePostId) > Number(lastSeenPostId));
  if (fresh.length === 0) return;

  const result = await pushIngest(fresh);
  lastSeenPostId = fresh[fresh.length - 1].sourcePostId;
  console.log(`Ingested ${fresh.length} posts. Added=${result.added}, skipped=${result.skipped}, latest=${lastSeenPostId}`);
};

const run = async () => {
  console.log("Starting FinancialJuice Telegram bridge...");
  console.log(`Source=${TELEGRAM_CHANNEL_URL}`);
  console.log(`Target=${INGEST_URL}`);
  console.log(`Poll interval=${POLL_MS}ms`);

  while (true) {
    try {
      await pollOnce();
    } catch (error) {
      console.error("Bridge loop error:", error instanceof Error ? error.message : String(error));
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

run().catch((error) => {
  console.error("Bridge startup failed:", error);
  process.exit(1);
});
