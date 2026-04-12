import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

type CalendarApiEvent = {
  id: string;
  time: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: 'high' | 'medium' | 'low';
};

export async function GET() {
  try {
    // We target the specific page for the Economic Calendar
    const response = await axios.get('https://www.forexfactory.com/calendar', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const $ = cheerio.load(response.data);
    const events: CalendarApiEvent[] = [];

    // Forex Factory uses a specific table structure for their calendar
    $('.calendar__row').each((_, el) => {
      const row = $(el);
      const time = row.find('.calendar__time').text().trim();
      const currency = row.find('.calendar__currency').text().trim();
      const event = row.find('.calendar__event').text().trim();
      const actual = row.find('.calendar__actual').text().trim();
      const forecast = row.find('.calendar__forecast').text().trim();
      const previous = row.find('.calendar__previous').text().trim();

      // Determine impact based on the 'impact' class (e.g., 'high', 'medium', 'low')
      const impactClass = row.find('.calendar__impact').attr('class') || '';
      let impact: CalendarApiEvent['impact'] = 'low';
      if (impactClass.includes('high')) impact = 'high';
      else if (impactClass.includes('medium')) impact = 'medium';

      if (event && currency) {
        events.push({
          id: Math.random().toString(36).substr(2, 9),
          time,
          currency,
          event,
          actual,
          forecast,
          previous,
          impact,
        });
      }
    });

    return NextResponse.json(events);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('ForexFactory Scraper Error:', message);
    return NextResponse.json({ error: "Failed to scrape Forex Factory" }, { status: 500 });
  }
}
