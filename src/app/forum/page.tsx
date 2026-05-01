"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircleMore, ShieldCheck } from "lucide-react";
import RoleBadges from "@/components/ui/RoleBadges";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchAuthStatus } from "@/lib/api/dataService";
import { useMarket } from "@/components/layout/MarketContext";

type ForumThread = {
  id: string;
  title: string;
  category: string;
  market: "forex" | "crypto" | "stocks";
  content: string;
  imageUrl?: string;
  authorName: string;
  authorRole?: "user" | "analyst" | "admin";
  authorIsVerifiedAnalyst?: boolean;
  createdAt: string;
};

type ForumReply = {
  id: string;
  threadId: string;
  authorName: string;
  authorRole?: "user" | "analyst" | "admin";
  authorIsVerifiedAnalyst?: boolean;
  content: string;
  imageUrl?: string;
  createdAt: string;
};

export default function ForumPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { market } = useMarket();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [threadImage, setThreadImage] = useState<File | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyImages, setReplyImages] = useState<Record<string, File | null>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canCreateThread, setCanCreateThread] = useState(false);

  const loadForumData = async () => {
    const [threadsRes, repliesRes] = await Promise.all([
      fetch(`/api/forum/threads?market=${market}`, { cache: "no-store" }),
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
  }, [market]);

  useEffect(() => {
    void fetchAuthStatus().then((status) => {
      setIsAuthenticated(status.isAuthenticated);
      const isAdmin = status.profile?.role === "admin";
      const isVa = Boolean(status.profile?.isVerifiedAnalyst);
      setCanCreateThread(isAdmin || isVa);
    });
  }, []);

  const threadReplyCount = useMemo(() => {
    return replies.reduce<Record<string, number>>((acc, reply) => {
      acc[reply.threadId] = (acc[reply.threadId] ?? 0) + 1;
      return acc;
    }, {});
  }, [replies]);

  const filteredReplies = replies.filter((reply) => threads.some((thread) => thread.id === reply.threadId));

  const latestReplies = filteredReplies.slice(0, 8).map((reply) => ({
    ...reply,
    threadTitle: threads.find((thread) => thread.id === reply.threadId)?.title ?? "Thread",
  }));

  const uploadImage = async (file: File, folder: "threads" | "replies") => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const ext = file.name.split(".").pop() || "png";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("forum-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw new Error("Image upload failed.");
    }

    const { data } = supabase.storage.from("forum-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const onCreateThread = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const imageUrl = threadImage ? await uploadImage(threadImage, "threads") : undefined;
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, market, content, imageUrl }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to create thread" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to create thread.");
      }

      setTitle("");
      setCategory("general");
      setThreadImage(null);
      setContent("");
      setStatusMessage("Thread posted.");
      await loadForumData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create thread.");
    } finally {
      setIsBusy(false);
    }
  };

  const onReply = async (threadId: string) => {
    if (!isAuthenticated) {
      setErrorMessage("Sign in to reply.");
      return;
    }
    const replyContent = replyDrafts[threadId]?.trim();
    if (!replyContent) {
      setErrorMessage("Reply cannot be empty.");
      return;
    }

    setIsBusy(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const imageFile = replyImages[threadId] ?? null;
      const imageUrl = imageFile ? await uploadImage(imageFile, "replies") : undefined;

      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, content: replyContent, imageUrl }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to post reply" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to post reply.");
      }

      setReplyDrafts((prev) => ({ ...prev, [threadId]: "" }));
      setReplyImages((prev) => ({ ...prev, [threadId]: null }));
      setStatusMessage("Reply posted.");
      await loadForumData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to post reply.");
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

      <div className="ff-panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--ink-primary)]">
            {market}
          </span>
          <span className="text-xs text-[var(--ink-muted)]">Only verified analysts can create threads.</span>
        </div>
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
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <span>{thread.authorName}</span>
                  <RoleBadges role={thread.authorRole} isVerifiedAnalyst={thread.authorIsVerifiedAnalyst} />
                  <span>|</span>
                  <span>{thread.market}</span>
                  <span>|</span>
                  <span>{thread.category}</span>
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{(threadReplyCount[thread.id] ?? 0).toLocaleString()} replies | {new Date(thread.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-[var(--ink-muted)] line-clamp-2">{thread.content}</p>
                {thread.imageUrl ? (
                  <div className="mt-2 overflow-hidden rounded border border-[var(--line-soft)]">
                    <img src={thread.imageUrl} alt="Forum attachment" className="h-40 w-full object-cover" />
                  </div>
                ) : null}

                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyDrafts[thread.id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                    className="min-h-[70px] w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-2 text-xs text-[var(--ink-primary)] outline-none"
                    placeholder={isAuthenticated ? "Write a reply..." : "Sign in to reply"}
                    disabled={!isAuthenticated || isBusy}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setReplyImages((prev) => ({
                          ...prev,
                          [thread.id]: e.target.files?.[0] ?? null,
                        }))
                      }
                      disabled={!isAuthenticated || isBusy}
                      className="text-xs text-[var(--ink-muted)]"
                    />
                    <button
                      type="button"
                      disabled={!isAuthenticated || isBusy}
                      onClick={() => onReply(thread.id)}
                      className="rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]"
                    >
                      Reply
                    </button>
                  </div>
                </div>
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
                  {reply.imageUrl ? (
                    <div className="mt-2 overflow-hidden rounded border border-[var(--line-soft)]">
                      <img src={reply.imageUrl} alt="Reply attachment" className="h-32 w-full object-cover" />
                    </div>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                    <span>{reply.authorName}</span>
                    <RoleBadges role={reply.authorRole} isVerifiedAnalyst={reply.authorIsVerifiedAnalyst} />
                    <span>|</span>
                    <span>{new Date(reply.createdAt).toLocaleString()}</span>
                  </p>
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
              <div className="grid gap-1">
                <label className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Market</label>
                <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--ink-primary)]">
                  {market}
                </div>
              </div>
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
                placeholder="Tag (optional)"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[90px] w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-2 text-xs text-[var(--ink-primary)] outline-none"
                placeholder="Share your context and setup..."
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThreadImage(e.target.files?.[0] ?? null)}
                className="text-xs text-[var(--ink-muted)]"
              />
              <button
                type="submit"
                disabled={isBusy || !canCreateThread}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] sm:w-auto sm:justify-start"
              >
                <MessageCircleMore size={13} />
                {!canCreateThread ? "Verified analysts only" : isBusy ? "Posting..." : "Post Thread"}
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


