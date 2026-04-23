"use client";

import { FormEvent, useState } from "react";
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

const MOCK_SENT: SentNotif[] = [
  {
    id: "n1",
    title: "Scheduled Maintenance",
    message: "The platform will undergo maintenance on Saturday 26 April at 02:00 UTC for approximately 30 minutes.",
    audience: "all",
    type: "warning",
    sentAt: "2026-04-22T15:00:00Z",
  },
  {
    id: "n2",
    title: "New Feature: Event Alerts",
    message: "You can now schedule 5-minute browser reminders for high-impact economic events from the sidebar dashboard.",
    audience: "all",
    type: "info",
    sentAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "n3",
    title: "Analyst Panel Guidelines Updated",
    message: "Please review the updated content guidelines for verified analyst perspectives. New bias confidence thresholds apply.",
    audience: "analysts",
    type: "info",
    sentAt: "2026-04-18T09:00:00Z",
  },
];

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
  const [sent, setSent] = useState<SentNotif[]>(MOCK_SENT);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<NotifAudience>("all");
  const [type, setType] = useState<NotifType>("info");
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    setSuccessMsg("");

    // Simulate send — wire to real API when notifications backend is built
    await new Promise((r) => setTimeout(r, 600));

    const newNotif: SentNotif = {
      id: `n${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      audience,
      type,
      sentAt: new Date().toISOString(),
    };
    setSent((prev) => [newNotif, ...prev]);
    setTitle("");
    setMessage("");
    setAudience("all");
    setType("info");
    setBusy(false);
    setSuccessMsg("Notification broadcast successfully.");
    setTimeout(() => setSuccessMsg(""), 4000);
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
        </form>
      </div>

      {/* Sent history */}
      <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 py-3 rounded-t-lg">
          <Bell size={14} className="text-[var(--ink-muted)]" />
          <h2 className="ff-panel-title text-xs text-[var(--ink-primary)]">Broadcast History</h2>
        </div>
        <div className="divide-y divide-[var(--line-soft)]">
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
