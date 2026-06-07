"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircleMore, Search, X, ZoomIn, ZoomOut } from "lucide-react";
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
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalZoom, setModalZoom] = useState(1);

  const loadForumData = useCallback(async () => {
    const [threadsRes, repliesRes] = await Promise.all([
      fetch(`/api/forum/threads?market=${market}`, { cache: "no-store" }),
      fetch("/api/forum/replies", { cache: "no-store" }),
    ]);

    if (!threadsRes.ok || !repliesRes.ok) {
      throw new Error("Unable to load forum data.");
    }

    const threadPayload = (await threadsRes.json()) as { threads: ForumThread[] };
    const replyPayload = (await repliesRes.json()) as { replies: ForumReply[] };
    const nextThreads = threadPayload.threads ?? [];
    setThreads(nextThreads);
    setReplies(replyPayload.replies ?? []);
    setSelectedThreadId((prev) => (prev && nextThreads.some((t) => t.id === prev) ? prev : nextThreads[0]?.id ?? ""));
  }, [market]);

  useEffect(() => {
    void loadForumData().catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load forum data.");
    });
  }, [loadForumData]);

  useEffect(() => {
    void fetchAuthStatus().then((status) => {
      setIsAuthenticated(status.isAuthenticated);
    });
  }, []);

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;

  const filteredThreads = threads.filter((thread) => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) return true;
    return `${thread.title} ${thread.category} ${thread.authorName}`.toLowerCase().includes(q);
  });

  const selectedReplies = replies
    .filter((reply) => reply.threadId === selectedThreadId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  const uploadImage = async (file: File, folder: "replies") => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const ext = file.name.split(".").pop() || "png";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("forum-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error("Image upload failed.");
    const { data } = supabase.storage.from("forum-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const onReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId) {
      setErrorMessage("Please select a thread first.");
      return;
    }
    if (!isAuthenticated) {
      setErrorMessage("Sign in to reply.");
      return;
    }
    const content = replyDraft.trim();
    if (!content) {
      setErrorMessage("Reply cannot be empty.");
      return;
    }

    setIsBusy(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const imageUrl = replyImage ? await uploadImage(replyImage, "replies") : undefined;
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: selectedThreadId, content, imageUrl }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to post reply" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to post reply.");
      }

      setReplyDraft("");
      setReplyImage(null);
      setStatusMessage("Reply posted.");
      await loadForumData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to post reply.");
    } finally {
      setIsBusy(false);
    }
  };

  const openImageModal = (url: string) => {
    setModalImageUrl(url);
    setModalZoom(1);
  };

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none sm:text-3xl">Community Forum</h1>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--ink-muted)]">
          Pick a thread, read full context, and follow replies in one focused workspace. Community posts are discussion and education,
          not personal financial advice. Verified analyst badges and moderation tools help keep market conversations accountable.
        </p>
      </div>

      <div className="ff-panel p-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search thread by title, tag, author"
              className="h-9 w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] pl-8 pr-2 text-xs text-[var(--ink-primary)] outline-none"
            />
          </div>
          <select
            value={selectedThreadId}
            onChange={(e) => setSelectedThreadId(e.target.value)}
            className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 text-xs text-[var(--ink-primary)] outline-none"
          >
            {filteredThreads.map((thread) => (
              <option key={thread.id} value={thread.id}>
                {thread.title} | {thread.category} | {thread.authorName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="ff-panel overflow-hidden">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Selected Thread</h2>
          </div>
          <div className="space-y-3 bg-[var(--surface-2)] p-3">
            {!selectedThread ? (
              <p className="text-xs text-[var(--ink-muted)]">No thread selected.</p>
            ) : (
              <>
                <article className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3">
                  <p className="text-lg font-semibold text-[var(--ink-primary)]">{selectedThread.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                    <span>{selectedThread.authorName}</span>
                    <RoleBadges role={selectedThread.authorRole} isVerifiedAnalyst={selectedThread.authorIsVerifiedAnalyst} />
                    <span>|</span>
                    <span>{selectedThread.market}</span>
                    <span>|</span>
                    <span>{selectedThread.category}</span>
                    <span>|</span>
                    <span>{new Date(selectedThread.createdAt).toLocaleString()}</span>
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--ink-primary)]">{selectedThread.content}</p>
                  {selectedThread.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => openImageModal(selectedThread.imageUrl as string)}
                      className="mt-3 block w-full overflow-hidden rounded border border-[var(--line-soft)] bg-black/40"
                    >
                      <img src={selectedThread.imageUrl} alt="Thread attachment" className="h-72 w-full object-contain" />
                    </button>
                  ) : null}
                </article>

                <form onSubmit={onReply} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Reply To This Thread</p>
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    className="min-h-[90px] w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-2 text-xs text-[var(--ink-primary)] outline-none"
                    placeholder={isAuthenticated ? "Write a reply..." : "Sign in to reply"}
                    disabled={!isAuthenticated || isBusy}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReplyImage(e.target.files?.[0] ?? null)}
                      disabled={!isAuthenticated || isBusy}
                      className="text-xs text-[var(--ink-muted)]"
                    />
                    <button
                      type="submit"
                      disabled={!isAuthenticated || isBusy}
                      className="inline-flex items-center gap-2 rounded border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)]"
                    >
                      <MessageCircleMore size={13} />
                      {isBusy ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="ff-panel overflow-hidden">
          <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-2">
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Replies</h2>
          </div>
          <div className="space-y-2 bg-[var(--surface-2)] p-3">
            {selectedReplies.map((reply) => (
              <div key={reply.id} className="rounded border border-[var(--line-soft)] bg-[var(--surface-hover)] p-3 text-sm">
                <p className="whitespace-pre-wrap text-[var(--ink-primary)]">{reply.content}</p>
                {reply.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => openImageModal(reply.imageUrl as string)}
                    className="mt-2 block w-full overflow-hidden rounded border border-[var(--line-soft)] bg-black/40"
                  >
                    <img src={reply.imageUrl} alt="Reply attachment" className="h-56 w-full object-contain" />
                  </button>
                ) : null}
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <span className="font-semibold text-[var(--ink-primary)]">{reply.authorName}</span>
                  <RoleBadges role={reply.authorRole} isVerifiedAnalyst={reply.authorIsVerifiedAnalyst} />
                  <span>|</span>
                  <span>{new Date(reply.createdAt).toLocaleString()}</span>
                </p>
              </div>
            ))}
            {selectedReplies.length === 0 ? <p className="text-xs text-[var(--ink-muted)]">No replies for this thread yet.</p> : null}
            {statusMessage ? <p className="text-xs text-[#2fd488]">{statusMessage}</p> : null}
            {errorMessage ? <p className="text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
          </div>
        </div>
      </section>

      {modalImageUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-[var(--ink-primary)]"
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => setModalZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-[var(--ink-primary)]"
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setModalImageUrl(null)}
              className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-[var(--ink-primary)]"
              aria-label="Close image viewer"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex h-[88vh] w-[92vw] items-center justify-center overflow-auto rounded border border-[var(--line-soft)] bg-black/40 p-3">
            <div className="flex min-h-full min-w-full items-center justify-center">
              <img
                src={modalImageUrl}
                alt="Preview"
                className="block h-auto w-auto object-contain"
                style={{ transform: `scale(${modalZoom})`, transformOrigin: "center center" }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
