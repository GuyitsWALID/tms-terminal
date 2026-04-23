"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Copy, Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type InviteCode = {
  code: string;
  invite_type: "analyst" | "admin";
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

export default function AdminInvitesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [inviteType, setInviteType] = useState<"analyst" | "admin">("analyst");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/invite-codes", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load invite codes");
      const data = (await res.json()) as { inviteCodes: InviteCode[] };
      setCodes(data.inviteCodes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatusMsg("");
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteType,
          maxUses: maxUses.trim() ? Number(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create invite code");
      setStatusMsg("Invite code created successfully.");
      setMaxUses("");
      setExpiresAt("");
      setInviteType("analyst");
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const active = codes.filter((c) => c.is_active);
  const inactive = codes.filter((c) => !c.is_active);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">
            Invite Codes
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Generate and manage analyst & admin invitation codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#2ecf8744] bg-[#2ecf8715] px-2.5 py-1 text-xs text-[#5de6a7]">
            Active: <strong>{active.length}</strong>
          </span>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-md bg-[var(--brand-strong)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-80"
          >
            <Plus size={13} />
            New Invite
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border border-[#ffb34744] bg-[#ffb34710] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#ffd28e]">Create New Invite Code</h2>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="grid gap-1">
              <label className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Type</label>
              <select
                value={inviteType}
                onChange={(e) => setInviteType(e.target.value as "analyst" | "admin")}
                className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 text-xs text-[var(--ink-primary)] outline-none"
              >
                <option value="analyst">Verified Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Max Uses</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 text-xs text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)]"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Expires At</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 text-xs text-[var(--ink-primary)] outline-none"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={busy}
                className="h-9 rounded-md bg-[var(--brand-strong)] px-4 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-9 rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 text-xs text-[var(--ink-muted)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {statusMsg && <p className="text-xs text-[#2ecf87]">{statusMsg}</p>}
      {error && <p className="text-xs text-[#ff8f8f]">{error}</p>}

      {/* Codes table */}
      <div className="overflow-auto rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <table className="min-w-[700px] w-full text-left text-xs">
          <thead className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Code</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Uses</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Expires</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Created</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line-soft)]">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--ink-muted)]">Loading codes…</td>
              </tr>
            )}
            {!loading && codes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--ink-muted)]">No invite codes yet.</td>
              </tr>
            )}
            {[...active, ...inactive].map((row) => (
              <tr key={row.code} className={cn("transition-colors hover:bg-[var(--surface-hover)]", !row.is_active && "opacity-50")}>
                <td className="px-4 py-3 font-mono font-semibold text-[var(--ink-primary)]">{row.code}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                    row.invite_type === "admin"
                      ? "bg-[#ff4b5522] text-[#ff8a8f] border border-[#ff4b5544]"
                      : "bg-[#2ecf8722] text-[#5de6a7] border border-[#2ecf8744]"
                  )}>
                    {row.invite_type === "admin" ? "Admin" : "Analyst"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.is_active
                    ? <span className="flex items-center gap-1 text-[#5de6a7]"><CheckCircle2 size={11} /> Active</span>
                    : <span className="flex items-center gap-1 text-[var(--ink-muted)]"><XCircle size={11} /> Inactive</span>
                  }
                </td>
                <td className="px-4 py-3 font-mono text-[var(--ink-primary)]">
                  {row.used_count}{row.max_uses ? ` / ${row.max_uses}` : ""}
                </td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">
                  {row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => copyCode(row.code)}
                    className="flex items-center gap-1 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <Copy size={10} />
                    {copied === row.code ? "Copied!" : "Copy"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
