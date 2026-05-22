"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

type SelectedStream = {
  instrument: string;
  view: string;
  url: string | null;
};

type LinkAction = { label: string; url: string | null };
type Instrument = { id: string; title: string; actions: LinkAction[] };
type Category = { id: string; title: string; instruments: Instrument[] };

const isValidUrl = (value: string | null) => !!value && /^https?:\/\//i.test(value);
const toYouTubeSearchUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const GOLD_YOUTUBE_SEARCH_URL = toYouTubeSearchUrl(
  "Bookmap Live Gold | GOLD FUTURES | GC - XAUUSD | Heatmap | Live Liquidity & Footprints 24/7"
);
const NQ_YOUTUBE_SEARCH_URL = toYouTubeSearchUrl(
  "Bookmap Live NQ | Nasdaq FUTURES | NQ - Nasdaq | Heatmap | Live Liquidity & Footprints 24/7"
);
const ES_YOUTUBE_SEARCH_URL = toYouTubeSearchUrl(
  "Bookmap Live ES | S&P 500 FUTURES | ES - S&P 500 | Heatmap | Live Liquidity & Footprints 24/7"
);

function LinkButton({ action, instrumentTitle, onOpen }: { action: LinkAction; instrumentTitle: string; onOpen: (stream: SelectedStream) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen({ instrument: instrumentTitle, view: action.label, url: action.url })}
      className="inline-flex h-9 items-center rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)]"
    >
      {action.label}
    </button>
  );
}

export default function ToolsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoading(false);
  }, []);


  const onOpenStream = (stream: SelectedStream) => {
    if (!isValidUrl(stream.url)) {
      setStatus(`${stream.instrument} ${stream.view} link is not set yet.`);
      return;
    }

    setStatus("");
    window.open(stream.url as string, "_blank", "noopener,noreferrer");
  };

  const categories: Category[] = [
    {
      id: "gold",
      title: "Gold",
      instruments: [
        {
          id: "xauusd",
          title: "XAU/USD",
          actions: [
            { label: "Order Flow", url: GOLD_YOUTUBE_SEARCH_URL },
          ],
        },
      ],
    },
    {
      id: "index",
      title: "Index",
      instruments: [
        {
          id: "nasdaq",
          title: "Nasdaq",
          actions: [
            { label: "Order Flow", url: NQ_YOUTUBE_SEARCH_URL },
          ],
        },
        {
          id: "es",
          title: "ES",
          actions: [
            { label: "Order Flow", url: ES_YOUTUBE_SEARCH_URL },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <section className="ff-panel p-4">
        <div className="inline-flex items-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
          <Wrench size={12} />
          Order Flow Tool
        </div>
      </section>

      <section className="ff-panel overflow-hidden">
        <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Order Flow</h2>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Live routing links managed from Admin.</p>
        </div>

        <div className="space-y-4 bg-[var(--surface-2)] p-4">
          {categories.map((category) => (
            <div key={category.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
              <h3 className="mb-3 font-rajdhani text-xl font-bold uppercase text-[var(--ink-primary)]">{category.title}</h3>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {category.instruments.map((instrument) => (
                  <article key={instrument.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-3">
                    <p className="text-sm font-semibold text-[var(--ink-primary)]">{instrument.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {instrument.actions.map((action) => (
                        <LinkButton
                          key={`${instrument.id}-${action.label}`}
                          action={action}
                          instrumentTitle={instrument.title}
                          onOpen={onOpenStream}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          {loading ? <p className="text-xs text-[var(--ink-muted)]">Loading links...</p> : null}
          {status ? <p className="text-xs text-[#ff6b6b]">{status}</p> : null}
        </div>
      </section>
    </div>
  );
}
