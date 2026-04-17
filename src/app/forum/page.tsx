"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircleMore, ShieldCheck } from "lucide-react";

type ForumThread = {
  id: string;
  title: string;
  category: string;
  content: string;
  authorName: string;
  createdAt: string;
};

type ForumReply = {
  id: string;
  threadId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export default function ForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const loadForumData = async () => {
    const [threadsRes, repliesRes] = await Promise.all([
      fetch("/api/forum/threads", { cache: "no-store" }),
      fetch("/api/forum/replies", { cache: "no-store" }),
    ]);

    if (!threadsRes.ok || !repliesRes.ok) {
      throw new Error("Unable to load forum data.");
    }

    const threadPayload = (await threadsRes.json()) as { threads: ForumThread[] };
    const replyPayload = (await repliesRes.json()) as { replies: ForumReply[] };
    setThreads(threadPayload.threads ?? []);
    setReplies(replyPayload.replies ?? []);
  };

  useEffect(() => {
    void loadForumData().catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load forum data.");
    });
  }, []);

  const threadReplyCount = useMemo(() => {
    return replies.reduce<Record<string, number>>((acc, reply) => {
      acc[reply.threadId] = (acc[reply.threadId] ?? 0) + 1;
      return acc;
    }, {});
  }, [replies]);

  const latestReplies = replies.slice(0, 8).map((reply) => ({
    ...reply,
    threadTitle: threads.find((thread) => thread.id === reply.threadId)?.title ?? "Thread",
  }));

  const onCreateThread = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to create thread" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to create thread.");
      }

      setTitle("");
      setCategory("general");
      setContent("");
      setStatusMessage("Thread posted.");
      await loadForumData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create thread.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Community Forum</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Trader conversations, journals, and event-driven strategy discussions.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="ff-panel overflow-hidden">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Most Replied Threads</h2>
          </div>
          <div className="space-y-2 bg-[var(--surface-2)] p-3">
            {threads.map((thread) => (
              <article key={thread.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3 text-sm hover:bg-[var(--surface-hover)]">
                <p className="font-semibold text-[var(--ink-primary)]">{thread.title}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{thread.authorName} | {thread.category}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{(threadReplyCount[thread.id] ?? 0).toLocaleString()} replies | {new Date(thread.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-[var(--ink-muted)] line-clamp-2">{thread.content}</p>
              </article>
            ))}
            {threads.length === 0 ? <p className="text-xs text-[var(--ink-muted)]">No threads yet.</p> : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="ff-panel overflow-hidden">
            <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
              <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Latest Replies</h2>
            </div>
            <div className="space-y-2 bg-[var(--surface-2)] p-3">
              {latestReplies.map((reply) => (
                <div key={reply.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3 text-sm">
                  <p className="font-semibold text-[var(--ink-primary)]">{reply.threadTitle}</p>
                  <p className="mt-1 text-[var(--ink-muted)]">{reply.content}</p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">{reply.authorName} | {new Date(reply.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {latestReplies.length === 0 ? <p className="text-xs text-[var(--ink-muted)]">No replies yet.</p> : null}
            </div>
          </div>

          <div className="ff-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-primary)]">
              <ShieldCheck size={14} />
              <h3 className="ff-panel-title text-sm">Create Thread</h3>
            </div>
            <form onSubmit={onCreateThread} className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-2 text-xs text-[var(--ink-primary)] outline-none"
                placeholder="Thread title"
                required
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-2 text-xs text-[var(--ink-primary)] outline-none"
                placeholder="Category"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[90px] w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-2 text-xs text-[var(--ink-primary)] outline-none"
                placeholder="Share your context and setup..."
                required
              />
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] sm:w-auto sm:justify-start"
              >
                <MessageCircleMore size={13} />
                {isBusy ? "Posting..." : "Post Thread"}
              </button>
            </form>
            {statusMessage ? <p className="mt-2 text-xs text-[#2fd488]">{statusMessage}</p> : null}
            {errorMessage ? <p className="mt-2 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}


