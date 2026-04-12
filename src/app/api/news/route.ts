import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

type NewsApiItem = {
  id: string;
  timestamp: string;
  headline: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  source: string;
  category: string;
};

export async function GET() {
  try {
    const response = await axios.get('https://www.financialjuice.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const $ = cheerio.load(response.data);
    const newsItems: NewsApiItem[] = [];

    // Financial Juice specific selectors for headlines
    $('.news-item, .headline, .item').each((_, el) => {
      const headline = $(el).find('a, span').first().text().trim();
      const timestamp = $(el).find('.time, .date').text().trim() || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (headline && headline.length > 10) {
        // Sentiment Analysis Logic
        const bullishWords = ['hike', 'growth', 'strong', 'bullish', 'surge', 'outperform', 'gain', 'support'];
        const bearishWords = ['cut', 'drop', 'weak', 'bearish', 'collapse', 'underperform', 'loss', 'slide'];
        let score = 0;
        const lowerText = headline.toLowerCase();
        bullishWords.forEach(word => { if (lowerText.includes(word)) score += 0.2; });
        bearishWords.forEach(word => { if (lowerText.includes(word)) score -= 0.2; });
        score = Math.max(-1, Math.min(1, score));

        newsItems.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp,
          headline,
          impact: headline.length < 50 ? 'medium' : 'low',
          sentiment: score > 0.2 ? 'bullish' : score < -0.2 ? 'bearish' : 'neutral',
          sentimentScore: score,
          source: "Financial Juice",
          category: "General",
        });
      }
    });

    return NextResponse.json(newsItems);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Financial Juice Scraper Error:', message);
    return NextResponse.json({ error: "Failed to scrape Financial Juice" }, { status: 500 });
  }
}
