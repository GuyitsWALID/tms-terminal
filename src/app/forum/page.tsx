import { MessageCircleMore, ShieldCheck } from "lucide-react";
import { forumsMostReplied } from "@/lib/terminalData";

const latestReplies = [
  { thread: "Gold with no drama", user: "TimeTells", message: "RIP Asia. Cornershop liquidity still thin around open.", time: "4 min ago" },
  { thread: "EURUSD session levels", user: "niko", message: "MT1 reclaimed. Watching NY continuation now.", time: "12 min ago" },
  { thread: "Risk paper scissors", user: "babayaga", message: "Sizing down ahead of CPI was the right call.", time: "25 min ago" },
];

export default function ForumPage() {
  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none">Community Forum</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Trader conversations, journals, and event-driven strategy discussions.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="ff-panel overflow-hidden">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Most Replied Threads</h2>
          </div>
          <div className="space-y-2 bg-[var(--surface-2)] p-3">
            {forumsMostReplied.map((thread) => (
              <article key={thread.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3 text-sm hover:bg-[var(--surface-hover)]">
                <p className="font-semibold text-[var(--ink-primary)]">{thread.title}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{thread.author} | {thread.category}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{thread.replies.toLocaleString()} replies | {thread.lastReply}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="ff-panel overflow-hidden">
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
              <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Latest Replies</h2>
            </div>
            <div className="space-y-2 bg-[var(--surface-2)] p-3">
              {latestReplies.map((reply) => (
                <div key={`${reply.thread}-${reply.user}`} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3 text-sm">
                  <p className="font-semibold text-[var(--ink-primary)]">{reply.thread}</p>
                  <p className="mt-1 text-[var(--ink-muted)]">{reply.message}</p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">{reply.user} | {reply.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <ShieldCheck size={14} />
              <h3 className="ff-panel-title text-sm">Verified Channels</h3>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">Verified traders have dedicated channels for pre-event playbooks and post-release debriefs.</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]">
              <MessageCircleMore size={13} />
              Open Verified Chat
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


