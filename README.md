# TMS Terminal
<img width="1904" height="947" alt="Screenshot 2026-05-03 130209" src="https://github.com/user-attachments/assets/95d8cdbf-8cbf-4d52-9fae-b53cf28fd48e" />
A lightweight **trading & macro “terminal”** built with **Next.js**.

TMS Terminal aggregates market information (quotes/tickers) and a live economic calendar into a single web UI, exposing data through simple API routes that the frontend can consume.

> This repository is a Next.js application. The UI lives in the `app/` directory and data is provided by server-side routes under `app/api/*`.

---

## Why this exists (Purpose)

Most retail trading workflows require multiple tabs/tools:

- a quote tool for quick prices
- an economic calendar site for macro events
- a custom dashboard/watchlist to glue it together

**TMS Terminal** aims to reduce that context-switching by providing a single app that:

- exposes a **Live Economic Calendar** feed
- exposes **Live Tickers/Quotes** via a Python `yfinance` pipeline

The goal is to keep the data plumbing inside the app so the UI can stay simple.

---

## What the app provides

### 1) Live Economic Calendar

- Endpoint: `GET /api/calendar`
- Source: the app’s internal scraper pipeline

This endpoint returns economic calendar data that the UI (or any client) can render.

### 2) Live Tickers (Python `yfinance`)

- Endpoint: `GET /api/tickers`
- Source: **Python `yfinance` only**

Important behavior:

- **No mock/fake values** are returned when upstream data fails.
- If `yfinance` fails or returns nothing, the API returns an error/empty response rather than fabricated prices.

---

## Tech stack

- **Next.js (App Router)**
- **Node.js**

