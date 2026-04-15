import json
import sys
from typing import Any

import yfinance as yf


def _to_float(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_symbols(argv: list[str]) -> list[str]:
    if len(argv) < 2:
        return []

    raw = argv[1]
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass

    return [item.strip() for item in raw.split(",") if item.strip()]


def _quote_for_symbol(symbol: str) -> dict[str, Any] | None:
    ticker = yf.Ticker(symbol)

    # yfinance exposes fast_info for low-latency quote fields.
    info = getattr(ticker, "fast_info", {}) or {}

    price = _to_float(info.get("last_price"))
    previous_close = _to_float(info.get("previous_close"))

    if price is None:
        history = ticker.history(period="2d", interval="1d", auto_adjust=False)
        if history is None or history.empty:
            return None

        closes = [float(value) for value in history["Close"].dropna().tolist()]
        if not closes:
            return None

        price = closes[-1]
        if previous_close is None and len(closes) > 1:
            previous_close = closes[-2]

    change_pct = 0.0
    if previous_close is not None and previous_close != 0:
        change_pct = ((price - previous_close) / previous_close) * 100

    return {
        "symbol": symbol,
        "price": price,
        "change_pct": change_pct,
    }


def main() -> int:
    symbols = _parse_symbols(sys.argv)
    if not symbols:
        print("[]")
        return 0

    rows: list[dict[str, Any]] = []
    for symbol in symbols:
        row = _quote_for_symbol(symbol)
        if row is not None:
            rows.append(row)

    print(json.dumps(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
