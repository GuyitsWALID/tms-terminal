import type { EconomicEvent } from "@/types";
import type { NewsItem } from "@/types/api";
import type { MarketKey } from "@/types";

export type PairCard = {
  symbol: string;
  bid: string;
  spread: string;
  change6h: string;
  direction: "up" | "down";
};

export type ForumThread = {
  id: string;
  title: string;
  author: string;
  category: string;
  replies: number;
  lastReply: string;
};

export type AnalystPost = {
  id: string;
  author: string;
  desk: string;
  pair: string;
  market: MarketKey;
  title: string;
  bias: "bullish" | "bearish" | "neutral";
  confidence: number;
  summary: string;
  published: string;
};

export type MarketSentimentRow = {
  pair: string;
  market: MarketKey;
  long: number;
  short: number;
};

export type AcademyQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  xp: number;
};

export const majorPairs: PairCard[] = [
  { symbol: "EUR/USD", bid: "1.0847", spread: "0.8", change6h: "+0.19%", direction: "up" },
  { symbol: "GBP/USD", bid: "1.2691", spread: "1.1", change6h: "-0.08%", direction: "down" },
  { symbol: "USD/JPY", bid: "151.18", spread: "0.9", change6h: "+0.27%", direction: "up" },
  { symbol: "USD/CHF", bid: "0.8952", spread: "1.0", change6h: "-0.11%", direction: "down" },
  { symbol: "AUD/USD", bid: "0.6623", spread: "0.9", change6h: "+0.04%", direction: "up" },
  { symbol: "NZD/USD", bid: "0.6094", spread: "1.2", change6h: "-0.05%", direction: "down" },
  { symbol: "USD/CAD", bid: "1.3617", spread: "1.0", change6h: "+0.09%", direction: "up" },
  { symbol: "XAU/USD", bid: "2324.62", spread: "12.0", change6h: "-0.22%", direction: "down" },
];

export const calendarEvents: EconomicEvent[] = [
  {
    id: "ec-01",
    time: "08:30",
    currency: "USD",
    event: "Non-Farm Employment Change",
    actual: "210K",
    forecast: "175K",
    previous: "190K",
    impact: "high",
    verifiedOpinion: "Stronger payroll print keeps the Fed in wait-and-see mode. USD likely supported into NY open.",
    isStarred: false,
  },
  {
    id: "ec-02",
    time: "09:00",
    currency: "EUR",
    event: "ECB President Speech",
    actual: "-",
    forecast: "-",
    previous: "-",
    impact: "high",
    verifiedOpinion: "Dovish rhetoric risks a fast EURUSD flush if inflation language weakens.",
    isStarred: true,
  },
  {
    id: "ec-03",
    time: "10:30",
    currency: "GBP",
    event: "CPI MoM",
    actual: "0.2%",
    forecast: "0.3%",
    previous: "0.4%",
    impact: "medium",
    verifiedOpinion: "Cooling inflation keeps BoE cut talk alive. GBP rallies should be faded near resistance.",
    isStarred: false,
  },
  {
    id: "ec-04",
    time: "13:00",
    currency: "JPY",
    event: "BoJ Rate Statement",
    actual: "0.1%",
    forecast: "0.1%",
    previous: "0.1%",
    impact: "high",
    verifiedOpinion: "No surprise expected, but wording on wage growth remains key for yen volatility.",
    isStarred: false,
  },
  {
    id: "ec-05",
    time: "15:30",
    currency: "USD",
    event: "Retail Sales MoM",
    actual: "0.4%",
    forecast: "0.2%",
    previous: "0.1%",
    impact: "medium",
    verifiedOpinion: "Consumer momentum still resilient. Favors USD strength on dips unless revisions miss.",
    isStarred: false,
  },
  {
    id: "ec-06",
    time: "17:00",
    currency: "CAD",
    event: "BoC Press Conference",
    actual: "-",
    forecast: "-",
    previous: "-",
    impact: "low",
    verifiedOpinion: "Neutral hold likely. CAD may track oil more than policy guidance in this session.",
    isStarred: false,
  },
];

export const featuredNews: NewsItem[] = [
  {
    id: "news-01",
    timestamp: "3 min ago",
    headline: "Fed official says inflation progress is uneven, policy should remain restrictive for now",
    impact: "high",
    sentiment: "bullish",
    sentimentScore: 0.42,
    source: "Financial Juice",
    category: "Monetary Policy",
    market: "forex",
  },
  {
    id: "news-02",
    timestamp: "11 min ago",
    headline: "Oil slips as traders price softer demand outlook into next quarter",
    impact: "medium",
    sentiment: "bearish",
    sentimentScore: -0.37,
    source: "Reuters Wire",
    category: "Commodities",
    market: "commodities",
  },
  {
    id: "news-03",
    timestamp: "18 min ago",
    headline: "Euro area PMIs beat expectations, growth stabilization narrative strengthens",
    impact: "medium",
    sentiment: "bullish",
    sentimentScore: 0.28,
    source: "Market Pulse",
    category: "Macro",
    market: "forex",
  },
  {
    id: "news-04",
    timestamp: "24 min ago",
    headline: "US treasury yields rebound as traders cut odds of near-term rate cuts",
    impact: "high",
    sentiment: "bearish",
    sentimentScore: -0.31,
    source: "Financial Juice",
    category: "Rates",
    market: "forex",
  },
  {
    id: "news-05",
    timestamp: "32 min ago",
    headline: "Bitcoin holds above key support as ETF inflows stabilize into US session",
    impact: "low",
    sentiment: "bullish",
    sentimentScore: 0.26,
    source: "Crypto Desk",
    category: "Digital Assets",
    market: "crypto",
  },
  {
    id: "news-06",
    timestamp: "44 min ago",
    headline: "Swiss franc gains as geopolitical demand for safe havens picks up",
    impact: "medium",
    sentiment: "neutral",
    sentimentScore: -0.1,
    source: "FX Wire",
    category: "FX Flows",
    market: "forex",
  },
];

export const hotStory = {
  title: "US Labor Data Beats Again, Dollar Index Pushes Higher Ahead of Fed Speakers",
  source: "Financial Juice",
  age: "13 min ago",
  body:
    "A stronger-than-expected labor print pushed rate-cut expectations further out. Verified traders remain split on follow-through, with most expecting USD momentum to hold through London close before potential mean reversion in NY afternoon.",
};

export const forumsMostReplied: ForumThread[] = [
  {
    id: "f-1",
    title: "Gold with no drama",
    author: "MoneyPrints",
    category: "Interactive Trading",
    replies: 45079,
    lastReply: "11 min ago",
  },
  {
    id: "f-2",
    title: "EURUSD session levels",
    author: "T721",
    category: "Trading Journals",
    replies: 2127,
    lastReply: "1 hr ago",
  },
  {
    id: "f-3",
    title: "Risk paper scissors",
    author: "crude8gold",
    category: "Risk Management",
    replies: 620,
    lastReply: "2 hr ago",
  },
  {
    id: "f-4",
    title: "London open scalps",
    author: "RonnieV",
    category: "Intraday",
    replies: 987,
    lastReply: "5 min ago",
  },
];

export const analystPosts: AnalystPost[] = [
  {
    id: "a-1",
    author: "Marcus Sterling",
    desk: "Macro FX Desk",
    pair: "EUR/USD",
    market: "forex",
    title: "Dovish ECB risk into resistance",
    bias: "bearish",
    confidence: 84,
    summary: "If ECB language softens, expect 1.0800 pressure and fade spikes into 1.0865.",
    published: "Today 07:40",
  },
  {
    id: "a-2",
    author: "Nadia Holt",
    desk: "US Rates",
    pair: "USD/JPY",
    market: "forex",
    title: "Yield spread still supports upside",
    bias: "bullish",
    confidence: 78,
    summary: "As long as 10Y holds bid, pullbacks toward 150.80 remain buy zones.",
    published: "Today 08:12",
  },
  {
    id: "a-3",
    author: "Victor Chen",
    desk: "Cross-Asset",
    pair: "XAU/USD",
    market: "commodities",
    title: "Gold vulnerable if real yields rise",
    bias: "bearish",
    confidence: 72,
    summary: "Break below 2318 opens room toward 2295. Watch US data for catalyst.",
    published: "Today 08:31",
  },
  {
    id: "a-4",
    author: "Ilyas Noor",
    desk: "Digital Assets",
    pair: "BTC/USD",
    market: "crypto",
    title: "BTC momentum tied to US session liquidity",
    bias: "bullish",
    confidence: 76,
    summary: "If spot bids keep stepping in above the previous day low, continuation toward local highs remains likely.",
    published: "Today 08:48",
  },
];

export const academyQuestions: AcademyQuestion[] = [
  {
    id: "q-1",
    topic: "Inflation",
    prompt: "When CPI prints above forecast, which first-order market reaction is most common?",
    options: [
      "Local currency weakens immediately",
      "Bond yields rise as cut odds are repriced",
      "Commodities always rally",
      "Volatility always declines",
    ],
    answerIndex: 1,
    explanation: "Higher inflation usually pushes yields higher because traders reduce near-term easing expectations.",
    xp: 20,
  },
  {
    id: "q-2",
    topic: "Central Banks",
    prompt: "A central bank turns more dovish than expected. What is the highest-probability FX impact?",
    options: [
      "Currency strengthens broadly",
      "Currency weakens versus higher-yield peers",
      "No impact if equities are up",
      "Only commodities are affected",
    ],
    answerIndex: 1,
    explanation: "Dovish policy usually compresses yield advantage, weighing on the currency.",
    xp: 25,
  },
  {
    id: "q-3",
    topic: "Risk",
    prompt: "Which action best protects against event-driven slippage before high-impact news?",
    options: [
      "Increase leverage to recover spread cost",
      "Hold size and remove stop-loss",
      "Reduce position size and widen execution tolerance",
      "Open correlated positions in same direction",
    ],
    answerIndex: 2,
    explanation: "Sizing down and accounting for execution gaps is a core risk-control approach around news events.",
    xp: 30,
  },
];

export const marketSentiment: MarketSentimentRow[] = [
  { pair: "EUR/USD", market: "forex", long: 42, short: 58 },
  { pair: "GBP/USD", market: "forex", long: 55, short: 45 },
  { pair: "USD/JPY", market: "forex", long: 61, short: 39 },
  { pair: "BTC/USD", market: "crypto", long: 57, short: 43 },
  { pair: "ETH/USD", market: "crypto", long: 54, short: 46 },
  { pair: "XAU/USD", market: "commodities", long: 47, short: 53 },
  { pair: "USOIL", market: "commodities", long: 44, short: 56 },
];

export const sessions = [
  { name: "Sydney", range: "22:00 - 07:00 UTC", active: false },
  { name: "Tokyo", range: "00:00 - 09:00 UTC", active: true },
  { name: "London", range: "07:00 - 16:00 UTC", active: true },
  { name: "New York", range: "13:00 - 22:00 UTC", active: false },
];

export const tickerTape = [
  { symbol: "EURUSD", price: "1.0847", change: "+0.19%", isUp: true },
  { symbol: "GBPUSD", price: "1.2691", change: "-0.08%", isUp: false },
  { symbol: "USDJPY", price: "151.18", change: "+0.27%", isUp: true },
  { symbol: "XAUUSD", price: "2324.62", change: "-0.22%", isUp: false },
  { symbol: "USDCAD", price: "1.3617", change: "+0.09%", isUp: true },
  { symbol: "AUDUSD", price: "0.6623", change: "+0.04%", isUp: true },
];
