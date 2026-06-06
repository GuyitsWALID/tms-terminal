import type { MarketKey } from "@/types";

export interface EpsHistoryPoint {
  quarter: string;
  epsActual: number | null;
  epsEstimate: number | null;
  surprisePct: number | null;
  status: "beat" | "miss" | "inline" | "upcoming";
}

export type EpsHistoryBatchResponse = Record<string, EpsHistoryPoint[]>;

export interface EarningsEntry {
  id: string;
  symbol: string;
  shortName: string;
  fiscalQuarterEnding: string;
  epsEstimate: number | null;
  epsActual: number | null;
  epsDifference: number | null;
  epsSurprisePct: number | null;
  lastYearEPS: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  revenueSurprisePct: number | null;
  reportTime: "BMO" | "AMC" | "TNS";
  reportDate: string;
  noOfEsts: number | null;
  status: "beat" | "miss" | "inline" | "upcoming";
  marketCap: number | null;
  price: number | null;
  changePercent: number | null;
  sector: string | null;
  industry: string | null;
  trailingPE: number | null;
  forwardPE: number | null;
  epsTrailingTwelveMonths: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  avgVolume: number | null;
}

export interface NewsItem {
  id: string;
  timestamp: string;
  headline: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  source: string;
  category: string;
  market?: MarketKey;
  sourcePostId?: string;
  publishedAt?: string;
  url?: string;
}

export interface CalendarEvent {
  time: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: 'high' | 'medium' | 'low';
}
