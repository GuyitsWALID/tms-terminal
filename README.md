# TMS Terminal

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
- **Python 3.10+** (required for the tickers pipeline)

---

## Getting started (local development)

### Prerequisites

- Node.js (recommended: latest LTS)
- Python 3.10+

### 1) Install Node dependencies

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### 2) Install Python dependencies

From the project root:

```bash
pip install -r requirements.txt
```

> If you use virtual environments, activate your venv before installing.

### 3) Optional configuration (`.env.local`)

Create `.env.local` to override Python runner settings:

```bash
# Optional: absolute path to Python executable.
# Example on Windows:
# PYTHON_EXECUTABLE=C:\\Python311\\python.exe
PYTHON_EXECUTABLE=

# Optional: absolute path to ticker script.
# Default: src/lib/python/yfinance_quotes.py
YFINANCE_SCRIPT_PATH=
```

### 4) Run the dev server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000

---

## API reference

### `GET /api/calendar`

Fetch the economic calendar data.

```bash
curl http://localhost:3000/api/calendar
```

### `GET /api/tickers`

Fetch tickers/quotes sourced from Python `yfinance`.

```bash
curl http://localhost:3000/api/tickers
```

---

## Editing the UI

Start editing the page at:

- `app/page.tsx`

The page auto-updates during development.

---

## Troubleshooting

### `/api/tickers` fails locally

Check:

1. Python is installed and accessible.
2. `pip install -r requirements.txt` ran successfully.
3. Any `.env.local` overrides point to valid paths.

### No fallback prices

This project intentionally does **not** return fake prices when upstream data fails.
If you need fallbacks, implement them in your client/UI or extend the API behavior.

---

## License

No license is specified yet. Add a `LICENSE` file if you want to make licensing explicit.
