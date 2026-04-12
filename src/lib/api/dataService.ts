// This is a service layer for fetching and parsing data.
// Since we cannot run a full Puppeteer/Playwright instance in the browser,
// we implement this as a server-side utility or a proxy fetch.

export async function fetchEconomicCalendar() {
  const res = await fetch('/api/calendar');
  if (!res.ok) throw new Error('Calendar fetch failed');
  return res.json();
}

export async function fetchNewsFeed() {
  const res = await fetch('/api/news');
  if (!res.ok) throw new Error('News fetch failed');
  return res.json();
}
