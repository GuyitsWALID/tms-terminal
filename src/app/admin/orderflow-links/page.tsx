"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Link2, Save } from "lucide-react";

type LinksState = {
  gold_heat_map_url: string;
  gold_foot_print_url: string;
  bitcoin_heat_map_url: string;
  bitcoin_foot_print_url: string;
  index_nasdaq_heat_map_url: string;
  index_nasdaq_foot_print_url: string;
  index_es_heat_map_url: string;
  index_es_foot_print_url: string;
};

const EMPTY_STATE: LinksState = {
  gold_heat_map_url: "",
  gold_foot_print_url: "",
  bitcoin_heat_map_url: "",
  bitcoin_foot_print_url: "",
  index_nasdaq_heat_map_url: "",
  index_nasdaq_foot_print_url: "",
  index_es_heat_map_url: "",
  index_es_foot_print_url: "",
};

type Field = { key: keyof LinksState; label: string };
const FIELDS: Field[] = [
  { key: "gold_heat_map_url", label: "Gold Heat Map URL" },
  { key: "gold_foot_print_url", label: "Gold Foot Print URL" },
  { key: "bitcoin_heat_map_url", label: "Bitcoin Heat Map URL" },
  { key: "bitcoin_foot_print_url", label: "Bitcoin Foot Print URL" },
  { key: "index_nasdaq_heat_map_url", label: "Nasdaq Heat Map URL" },
  { key: "index_nasdaq_foot_print_url", label: "Nasdaq Foot Print URL" },
  { key: "index_es_heat_map_url", label: "ES Heat Map URL" },
  { key: "index_es_foot_print_url", label: "ES Foot Print URL" },
];

export default function AdminOrderflowLinksPage() {
  const [form, setForm] = useState<LinksState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/orderflow-links", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load order flow links.");
        const data = (await res.json()) as { links: Partial<LinksState> & { updated_at?: string } | null };
        if (data.links) {
          setForm({
            gold_heat_map_url: data.links.gold_heat_map_url ?? "",
            gold_foot_print_url: data.links.gold_foot_print_url ?? "",
            bitcoin_heat_map_url: data.links.bitcoin_heat_map_url ?? "",
            bitcoin_foot_print_url: data.links.bitcoin_foot_print_url ?? "",
            index_nasdaq_heat_map_url: data.links.index_nasdaq_heat_map_url ?? "",
            index_nasdaq_foot_print_url: data.links.index_nasdaq_foot_print_url ?? "",
            index_es_heat_map_url: data.links.index_es_heat_map_url ?? "",
            index_es_foot_print_url: data.links.index_es_foot_print_url ?? "",
          });
          setUpdatedAt(data.links.updated_at ?? null);
        }
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Unable to load order flow links.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/orderflow-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to save order flow links.");
      }
      const payload = (await res.json()) as { links: { updated_at?: string } };
      setUpdatedAt(payload.links?.updated_at ?? null);
      setSuccessMsg("Order flow links updated.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unable to save order flow links.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">Orderflow Links</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Add the current live YouTube URLs for Gold, Bitcoin, Nasdaq, and ES streams.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
          <Link2 size={14} className="text-[#1d9bf0]" />
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Live Stream URL Manager</h2>
        </div>
        {loading ? (
          <p className="p-4 text-xs text-[var(--ink-muted)]">Loading links...</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 p-4">
            {FIELDS.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">{field.label}</label>
                <input
                  value={form[field.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder="https://www.youtube.com/live/..."
                  className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--ring-accent)]"
                />
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                <Save size={12} />
                {saving ? "Saving..." : "Save Links"}
              </button>
              {successMsg && (
                <span className="flex items-center gap-1.5 text-xs text-[#5de6a7]">
                  <CheckCircle2 size={13} />
                  {successMsg}
                </span>
              )}
            </div>

            {updatedAt ? <p className="text-[11px] text-[var(--ink-muted)]">Last updated: {new Date(updatedAt).toLocaleString()}</p> : null}
            {errorMsg ? <p className="text-xs text-[#ff8f8f]">{errorMsg}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
