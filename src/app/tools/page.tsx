import { BadgeDollarSign, Wrench } from "lucide-react";

type OrderflowStream = {
  id: string;
  title: string;
  pair: string;
  channel: string;
  liveUrl: string;
  note: string;
  category: "Gold" | "Major FX" | "Index";
};

const orderflowStreams: OrderflowStream[] = [
  {
    id: "of-1",
    title: "Gold Footprint Live",
    pair: "XAU/USD",
    channel: "Community Stream",
    liveUrl: "https://www.youtube.com/live/L-tSR5B7J5g",
    note: "Live footprint stream for gold execution and flow reading.",
    category: "Gold",
  },
];

const categoryOrder: OrderflowStream["category"][] = ["Gold", "Major FX", "Index"];

const toYoutubeEmbedUrl = (url: string) => {
  const liveMatch = url.match(/youtube\.com\/live\/([^?&/]+)/i);
  if (liveMatch?.[1]) return `https://www.youtube.com/embed/${liveMatch[1]}`;

  const watchMatch = url.match(/[?&]v=([^?&/]+)/i);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  return url;
};

export default function ToolsPage() {
  return (
    <div className="space-y-4">
      <section className="ff-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
              <Wrench size={12} />
              TMS Tools
            </div>
            <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Free Tools Hub</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--ink-muted)]">
              Access free trading tools from one place. First module: live Orderflow streams by category, so traders and TMS students can
              practice without paying for expensive monthly platforms.
            </p>
          </div>
          <div className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--ink-muted)]">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--ink-primary)]">
              <BadgeDollarSign size={14} />
              Cost Relief
            </div>
            <p>Goal: make high-value orderflow access available for free inside the terminal.</p>
          </div>
        </div>
      </section>

      <section className="ff-panel overflow-hidden">
        <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
          <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Orderflow</h2>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Live footprint and flow streams organized by instrument category.</p>
        </div>

        <div className="space-y-4 bg-[var(--surface-2)] p-4">
          {categoryOrder.map((category) => {
            const streams = orderflowStreams.filter((stream) => stream.category === category);

            return (
              <div key={category} className="rounded border border-[var(--line-soft)] bg-[var(--surface-3)] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-rajdhani text-xl font-bold uppercase text-[var(--ink-primary)]">{category}</h3>
                  <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                    {streams.length} stream{streams.length === 1 ? "" : "s"}
                  </span>
                </div>

                {streams.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {streams.map((stream) => (
                      <article key={stream.id} className="w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-3">
                        <h4 className="text-sm font-semibold text-[var(--ink-primary)]">{stream.title}</h4>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          {stream.pair} | {stream.channel}
                        </p>
                        <p className="mt-2 text-xs text-[var(--ink-muted)]">{stream.note}</p>

                        <div className="mt-3 overflow-hidden rounded border border-[var(--line-strong)] bg-black">
                          <iframe
                            title={stream.title}
                            src={toYoutubeEmbedUrl(stream.liveUrl)}
                            className="h-[220px] w-full sm:h-[300px] md:h-[460px] xl:h-[560px]"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--ink-muted)]">No streams added yet. Links for this category will be published soon.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="ff-panel p-4">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Upcoming Modules</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-sm">
            <p className="font-semibold text-[var(--ink-primary)]">Volume Profile Lab</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Planned practical module for TMS students to train auction and value-area reading.</p>
          </div>
          <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-sm">
            <p className="font-semibold text-[var(--ink-primary)]">Orderflow Practice Room</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Structured exercises and replay drills will be added after the volume profile module is ready.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
