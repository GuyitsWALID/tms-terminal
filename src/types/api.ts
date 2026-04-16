import type { MarketKey } from "@/types";

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
