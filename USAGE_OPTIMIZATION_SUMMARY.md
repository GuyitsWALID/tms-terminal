# Financial Vibe - Vercel Usage Optimization Summary

## Purpose
This document summarizes the optimization work completed to reduce Vercel Hobby usage pressure, especially:
- Fluid Provisioned Memory
- Fluid Active CPU

Date: May 25, 2026

---

## Goals We Aligned On
1. Keep TradingView widgets for News and Economic Calendar.
2. Keep FinancialJuice as strict real-time.
3. Remove internal fallback stacks that duplicate server load.
4. Reduce unnecessary polling and function churn.
5. Add safe CDN caching to read-only APIs.

---

## Changes Implemented

### 1) Removed internal news fallback stack
- Deleted `src/components/news/NewsFeed.tsx`
- Deleted `src/app/api/news/route.ts`
- Removed unused news fetch helpers from `src/lib/api/dataService.ts`

Impact:
- Eliminates duplicated internal news aggregation requests.
- Reduces serverless function invocations and runtime pressure.

---

### 2) FinancialJuice real-time kept, duplicate polling reduced
Updated `src/components/news/FinancialJuiceLivePanel.tsx`:
- SSE (`/api/news/live`) remains primary real-time source.
- 12s polling (`/api/news/financialjuice`) now acts as fallback only when stream is disconnected.
- Polling pauses again when SSE reconnects.

Impact:
- Preserves real-time behavior while removing continuous duplicate pull traffic.

---

### 3) Users-online feature removed fully
- Deleted `src/app/api/analytics/users-online/route.ts`
- Removed users-online fetch/state/UI dependency from `src/components/layout/LiveSessionsPanel.tsx`
- Session panel now uses session-based estimate only.

Impact:
- Removes recurring background requests and related function execution.

---

### 4) Reduced ticker polling frequency (moderate profile)
Updated `src/hooks/useLiveTickers.ts`:
- Active tab polling: 15s
- Hidden tab polling: 60s

Impact:
- Large drop in frequent API hits versus prior high-frequency behavior.

---

### 5) Added short CDN caching to non-auth read APIs
Implemented `Cache-Control` with `s-maxage` + `stale-while-revalidate`:

- `src/app/api/tickers/route.ts`
  - `public, s-maxage=15, stale-while-revalidate=60`
  - in-memory soft TTL increased to 15s

- `src/app/api/earnings/route.ts`
  - `public, s-maxage=60, stale-while-revalidate=300`

- `src/app/api/earnings/history/[symbol]/route.ts`
  - `public, s-maxage=300, stale-while-revalidate=1800`

- `src/app/api/calendar/route.ts`
  - short cache policies for read responses and safe shorter policies for pending/error variants

- `src/app/api/calendar/detail/route.ts`
  - `public, s-maxage=300, stale-while-revalidate=1800` for normal responses

Impact:
- CDN can serve many repeated reads without re-running functions every time.
- Reduces Fluid memory/CPU accumulation.

---

### 6) Removed unnecessary `force-dynamic` on read-heavy earnings routes
- Removed from:
  - `src/app/api/earnings/route.ts`
  - `src/app/api/earnings/history/[symbol]/route.ts`

Kept `force-dynamic` only where justified (real-time/write-sensitive routes):
- `src/app/api/news/live/route.ts`
- `src/app/api/news/financialjuice/route.ts`
- `src/app/api/news/ingest/financialjuice/route.ts`
- `src/app/api/contact/route.ts`

Impact:
- Restores caching opportunities on read endpoints that do not require per-request dynamic behavior.

---

### 7) Home/news widget behavior aligned to TradingView-only requirement
- Home and news pages now keep TradingView widget-first behavior for News and Economic Calendar.
- Removed non-TradingView fallback content for those sections.

Impact:
- Simplifies data source paths and reduces internal fallback traffic complexity.

---

### 8) Forex majors widget reliability fix
Updated `src/components/charts/TradingViewSymbolInfoCard.tsx`:
- Removed forced dev-fallback initialization.
- Increased iframe detection grace timeout from 2.5s to 6s.

Impact:
- Prevents false fallback mode and restores expected TradingView widget loading.

---

### 9) Lint stability fix completed
Updated `src/app/tools/page.tsx`:
- Removed synchronous `setState` inside effect causing lint error.

Status:
- Lint now passes with 0 errors (non-blocking image warnings remain).

---

## What We Expect from These Changes
Primary expected improvements after deploy:
1. Slower growth of Fluid Provisioned Memory
2. Lower Fluid Active CPU accumulation
3. Fewer non-essential function executions

---

## Post-Deploy Verification Plan (24-72h)
1. In Vercel Usage dashboard, compare slopes before/after for:
   - Fluid Provisioned Memory
   - Fluid Active CPU
2. Confirm FinancialJuice real-time delivery remains healthy.
3. Validate no unexpected regression in:
   - TradingView News/Economic Calendar display
   - Tickers update cadence
   - Calendar/Earnings response freshness

---

## Remaining Non-Blocking Notes
- ESLint still shows `<img>` optimization warnings in:
  - `src/app/forum/page.tsx`
  - `src/app/profile/page.tsx`
- These warnings are not blockers for usage optimization rollout.

---

## Final Recommendation
Deploy current optimization set and monitor Vercel usage for 2-3 days.  
If Fluid usage is still higher than desired, next tuning step should be tightening cache windows and/or further increasing non-FinancialJuice polling intervals.

