"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, CheckCircle2, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type NotifAudience = "all" | "analysts" | "admins";
type NotifType = "info" | "warning" | "critical";

type SentNotif = {
  id: string;
  title: string;
  message: string;
  audience: NotifAudience;
  type: NotifType;
  sentAt: string;
};

const TYPE_CONFIG: Record<NotifType, { label: string; color: string; bg: string; border: string }> = {
  info: { label: "Info", color: "#8bc0ff", bg: "#1d9bf015", border: "#1d9bf044" },
  warning: { label: "Warning", color: "#ffd28e", bg: "#ffb34715", border: "#ffb34744" },
  critical: { label: "Critical", color: "#ff9ea3", bg: "#ff4b5515", border: "#ff4b5544" },
};

const AUDIENCE_CONFIG: Record<NotifAudience, { label: string; icon: React.ElementType }> = {
  all: { label: "All Users", icon: Users },
  analysts: { label: "Analysts Only", icon: Bell },
  admins: { label: "Admins Only", icon: Bell },
};

export default function AdminNotificationsPage() {
  const [sent, setSent] = useState<SentNotif[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<NotifAudience>("all");
  const [type, setType] = useState<NotifType>("info");
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load notifications");
        const data = (await res.json()) as { notifications: Array<{ id: string; title: string; message: string; audience: NotifAudience; type: NotifType; sent_at: string }> };
        const mapped = (data.notifications ?? []).map((notif) => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          audience: notif.audience,
          type: notif.type,
          sentAt: notif.sent_at,
        }));
        setSent(mapped);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), audience, type }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to send notification.");
      }
      const payload = (await res.json()) as { notification: { id: string; title: string; message: string; audience: NotifAudience; type: NotifType; sent_at: string } };
      const newNotif: SentNotif = {
        id: payload.notification.id,
        title: payload.notification.title,
        message: payload.notification.message,
        audience: payload.notification.audience,
        type: payload.notification.type,
        sentAt: payload.notification.sent_at,
      };
      setSent((prev) => [newNotif, ...prev]);
      setTitle("");
      setMessage("");
      setAudience("all");
      setType("info");
      setSuccessMsg("Notification broadcast successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unable to send notification.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Broadcast platform-wide alerts and announcements to your users.
        </p>
      </div>

      {/* Compose form */}
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
          <Send size={14} className="text-[#1d9bf0]" />
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Compose Notification</h2>
        </div>
        <form onSubmit={handleSend} className="space-y-4 p-4">
          {/* Type & Audience row */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Type</label>
              <div className="inline-flex overflow-hidden rounded border border-[var(--line-soft)]">
                {(["info", "warning", "critical"] as const).map((t, i) => {
                  const cfg = TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "flex-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                        i > 0 && "border-l border-[var(--line-soft)]",
                        type === t
                          ? "text-[var(--ink-primary)] bg-[var(--surface-hover)]"
                          : "text-[var(--ink-muted)] bg-[var(--surface-1)]"
                      )}
                    >
                      <span style={{ color: type === t ? cfg.color : undefined }}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as NotifAudience)}
                className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 text-xs text-[var(--ink-primary)] outline-none"
              >
                <option value="all">All Users</option>
                <option value="analysts">Analysts Only</option>
                <option value="admins">Admins Only</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="grid gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title…"
              maxLength={80}
              required
              className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--ring-accent)]"
            />
          </div>

          {/* Message */}
          <div className="grid gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here…"
              rows={4}
              required
              className="w-full rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--ring-accent)] resize-none"
            />
          </div>

          {/* Preview strip */}
          {title && (
            <div
              className="rounded border p-3"
              style={{
                background: TYPE_CONFIG[type].bg,
                borderColor: TYPE_CONFIG[type].border,
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: TYPE_CONFIG[type].color }}>
                Preview · {TYPE_CONFIG[type].label} · {AUDIENCE_CONFIG[audience].label}
              </p>
              <p className="text-sm font-semibold text-[var(--ink-primary)]">{title}</p>
              {message && <p className="mt-1 text-xs text-[var(--ink-muted)]">{message}</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy || !title.trim() || !message.trim()}
              className="flex items-center gap-2 rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              <Send size={12} />
              {busy ? "Sending…" : "Send Notification"}
            </button>
            {successMsg && (
              <span className="flex items-center gap-1.5 text-xs text-[#5de6a7]">
                <CheckCircle2 size={13} />
                {successMsg}
              </span>
            )}
          </div>
          {errorMsg && <p className="text-xs text-[#ff8f8f]">{errorMsg}</p>}
        </form>
      </div>

      {/* Sent history */}
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
          <Bell size={14} className="text-[var(--ink-muted)]" />
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Broadcast History</h2>
        </div>
        <div className="divide-y divide-[var(--line-soft)]">
          {loading && (
            <p className="px-4 py-6 text-center text-xs text-[var(--ink-muted)]">Loading notifications…</p>
          )}
          {!loading && sent.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-[var(--ink-muted)]">No notifications sent yet.</p>
          )}
          {sent.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type];
            const AudienceIcon = AUDIENCE_CONFIG[notif.audience].icon;
            return (
              <div key={notif.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                  style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  {cfg.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ink-primary)]">{notif.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)] line-clamp-2">{notif.message}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1">
                      <AudienceIcon size={9} />
                      {AUDIENCE_CONFIG[notif.audience].label}
                    </span>
                    <span>{new Date(notif.sentAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
