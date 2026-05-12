"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Thread = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  category: string;
  market: "forex" | "crypto" | "stocks";
  content: string;
  imageUrl?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ThreadForm = {
  title: string;
  category: string;
  market: "forex" | "crypto" | "stocks";
  content: string;
  imageUrl: string;
};

const EMPTY_FORM: ThreadForm = { title: "", category: "general", market: "forex", content: "", imageUrl: "" };

export default function AdminCreateThreadPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [form, setForm] = useState<ThreadForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Thread | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/threads", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load threads.");
      const data = (await res.json()) as { threads: Thread[] };
      setThreads(data.threads ?? []);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unable to load threads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(
    () => [...threads].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [threads]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      const payload = { ...form };
      const res = await fetch("/api/admin/threads", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(p.error ?? "Unable to save thread.");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setStatusMsg(editingId ? "Thread updated." : "Thread created.");
      await load();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unable to save thread.");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = (thread: Thread) => {
    setEditingId(thread.id);
    setForm({
      title: thread.title,
      category: thread.category,
      market: thread.market,
      content: thread.content,
      imageUrl: thread.imageUrl ?? "",
    });
  };

  const onArchiveToggle = async (thread: Thread) => {
    const res = await fetch("/api/admin/threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: thread.id, action: thread.isArchived ? "unarchive" : "archive" }),
    });
    if (res.ok) await load();
  };

  const onDelete = async (thread: Thread) => {
    const res = await fetch(`/api/admin/threads?id=${encodeURIComponent(thread.id)}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">Create Threads</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Create and manage forum threads. Ownership controls apply for VA.</p>
      </div>

      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] p-4">
        <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">{editingId ? "Edit Thread" : "New Create Thread"}</h2>
        <form onSubmit={submit} className="mt-3 grid gap-2">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-xs" required />
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-xs" />
            <select value={form.market} onChange={(e) => setForm((p) => ({ ...p, market: e.target.value as "forex" | "crypto" | "stocks" }))} className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-xs">
              <option value="forex">forex</option>
              <option value="crypto">crypto</option>
              <option value="stocks">stocks</option>
            </select>
          </div>
          <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Thread content" rows={5} className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-2 text-xs" required />
          <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Image URL (optional)" className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-xs" />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded bg-[var(--brand-strong)] px-3 py-2 text-xs font-bold uppercase text-white">{busy ? "Saving..." : editingId ? "Save Changes" : "Create Thread"}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="rounded border border-[var(--line-soft)] px-3 py-2 text-xs">Cancel</button> : null}
          </div>
          {statusMsg ? <p className="text-xs text-[#5de6a7]">{statusMsg}</p> : null}
          {errorMsg ? <p className="text-xs text-[#ff8f8f]">{errorMsg}</p> : null}
        </form>
      </div>

      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3">
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Created Threads</h2>
        </div>
        <div className="divide-y divide-[var(--line-soft)]">
          {loading ? <p className="px-4 py-6 text-xs text-[var(--ink-muted)]">Loading threads...</p> : null}
          {!loading && sorted.length === 0 ? <p className="px-4 py-6 text-xs text-[var(--ink-muted)]">No threads yet.</p> : null}
          {sorted.map((thread) => (
            <div key={thread.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-primary)]">{thread.title}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">{thread.authorName} | {thread.market} | {thread.category} | {thread.isArchived ? "Archived" : "Live"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(thread)} className="rounded border border-[var(--line-soft)] px-2 py-1 text-[11px]">Edit</button>
                  <button onClick={() => onArchiveToggle(thread)} className="rounded border border-[var(--line-soft)] px-2 py-1 text-[11px]">{thread.isArchived ? "Unarchive" : "Archive"}</button>
                  <button onClick={() => setPendingDelete(thread)} className="rounded border border-[#ff4b5544] bg-[#ff4b5515] px-2 py-1 text-[11px] text-[#ff9ea3]">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--line-strong)] bg-[var(--surface-1)] p-4">
            <h3 className="font-rajdhani text-xl font-bold uppercase text-[var(--ink-primary)]">Delete Thread</h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Are you sure you want to delete <span className="font-semibold text-[var(--ink-primary)]">{pendingDelete.title}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = pendingDelete;
                  setPendingDelete(null);
                  if (target) await onDelete(target);
                }}
                className="rounded border border-[#ff4b5544] bg-[#ff4b5515] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#ff9ea3]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
