"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, Flag, MessageSquare, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ComplaintStatus = "open" | "under_review" | "resolved" | "dismissed";
type ComplaintSeverity = "low" | "medium" | "high";

type Complaint = {
  id: string;
  reportedUser: string;
  reportedBy: string;
  category: string;
  summary: string;
  detail: string;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  threadUrl: string;
  createdAt: string;
  updatedAt: string;
};

// Mock data – wire to real API when the forum reports endpoint is built
const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: "cmp-001",
    reportedUser: "@fx_spammer99",
    reportedBy: "@macro_hawk",
    category: "Spam",
    summary: "Posting repeated promotional links in #FX Analysis thread",
    detail: "User has posted the same off-site link 7 times in the past 24 hours. The links appear to be affiliate links to an unrelated product. Other members have flagged it multiple times.",
    severity: "high",
    status: "open",
    threadUrl: "/forum/threads/fx-analysis-001",
    createdAt: "2026-04-23T06:14:00Z",
    updatedAt: "2026-04-23T06:14:00Z",
  },
  {
    id: "cmp-002",
    reportedUser: "@cryptobully22",
    reportedBy: "@silver_trader",
    category: "Harassment",
    summary: "Targeted harassment towards multiple members in DM and public threads",
    detail: "Multiple reports received from three different users about this account. The reports describe unprovoked hostile messages and public ridicule.",
    severity: "high",
    status: "under_review",
    threadUrl: "/forum/threads/general-001",
    createdAt: "2026-04-22T18:30:00Z",
    updatedAt: "2026-04-23T05:00:00Z",
  },
  {
    id: "cmp-003",
    reportedUser: "@signal_seller",
    reportedBy: "@pipeline_ed",
    category: "Misinformation",
    summary: "Posting fabricated trade signals as verified analyst content",
    detail: "User is not a verified analyst but is presenting their posts as such, using similar formatting to the verified analyst panel.",
    severity: "medium",
    status: "open",
    threadUrl: "/forum/threads/signals-010",
    createdAt: "2026-04-22T11:20:00Z",
    updatedAt: "2026-04-22T11:20:00Z",
  },
  {
    id: "cmp-004",
    reportedUser: "@old_troll_86",
    reportedBy: "@admin",
    category: "Inappropriate Content",
    summary: "Posting off-topic political content repeatedly",
    detail: "Account has been warned twice already. Continued posting of unrelated political commentary in trading-focused channels.",
    severity: "low",
    status: "resolved",
    threadUrl: "/forum/threads/offopic-004",
    createdAt: "2026-04-20T09:00:00Z",
    updatedAt: "2026-04-21T10:00:00Z",
  },
];

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  open: { label: "Open", color: "#ff9ea3", bg: "#ff4b5515", border: "#ff4b5544", icon: AlertTriangle },
  under_review: { label: "Under Review", color: "#ffd28e", bg: "#ffb34715", border: "#ffb34744", icon: Clock },
  resolved: { label: "Resolved", color: "#5de6a7", bg: "#2ecf8715", border: "#2ecf8744", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "var(--ink-muted)", bg: "var(--surface-3)", border: "var(--line-soft)", icon: XCircle },
};

const SEVERITY_CONFIG: Record<ComplaintSeverity, { label: string; color: string }> = {
  high: { label: "High", color: "#ff4b55" },
  medium: { label: "Medium", color: "#ffb347" },
  low: { label: "Low", color: "#5de6a7" },
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all");

  const setStatus = (id: string, status: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c))
    );
  };

  const filtered = complaints.filter(
    (c) => statusFilter === "all" || c.status === statusFilter
  );

  const openCount = complaints.filter((c) => c.status === "open").length;
  const reviewCount = complaints.filter((c) => c.status === "under_review").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">
            Complaints
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Forum reports and moderation decisions.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {openCount > 0 && (
            <span className="rounded border border-[#ff4b5544] bg-[#ff4b5515] px-2.5 py-1 text-xs text-[#ff9ea3]">
              {openCount} Open
            </span>
          )}
          {reviewCount > 0 && (
            <span className="rounded border border-[#ffb34744] bg-[#ffb34715] px-2.5 py-1 text-xs text-[#ffd28e]">
              {reviewCount} In Review
            </span>
          )}
        </div>
      </div>

      {/* Status filter */}
      <div className="inline-flex overflow-hidden rounded border border-[var(--line-soft)]">
        {(["all", "open", "under_review", "resolved", "dismissed"] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
              statusFilter === s
                ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                : "bg-[var(--surface-1)] text-[var(--ink-muted)]",
              i > 0 && "border-l border-[var(--line-soft)]"
            )}
          >
            {s === "under_review" ? "In Review" : s}
          </button>
        ))}
      </div>

      {/* Complaints list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
            <Flag size={24} className="mx-auto mb-2 opacity-25" />
            No complaints in this category.
          </div>
        )}
        {filtered.map((complaint) => {
          const statusCfg = STATUS_CONFIG[complaint.status];
          const severityCfg = SEVERITY_CONFIG[complaint.severity];
          const isExpanded = expandedId === complaint.id;
          const StatusIcon = statusCfg.icon;

          return (
            <div
              key={complaint.id}
              className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] overflow-hidden"
            >
              {/* Row header */}
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
              >
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                  style={{ color: severityCfg.color, background: `${severityCfg.color}18`, border: `1px solid ${severityCfg.color}44` }}
                >
                  {severityCfg.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink-primary)]">
                    {complaint.summary}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                    {complaint.reportedUser} · reported by {complaint.reportedBy} · {new Date(complaint.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                >
                  <StatusIcon size={10} />
                  {statusCfg.label}
                </span>
                <span className="shrink-0 text-[var(--ink-muted)]">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-[var(--line-strong)] bg-[var(--surface-2)] p-4 space-y-4">
                  <div className="grid gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">Report Detail</p>
                    <p className="text-sm text-[var(--ink-primary)]">{complaint.detail}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-[var(--ink-muted)]">
                    <span>Category: <strong className="text-[var(--ink-primary)]">{complaint.category}</strong></span>
                    <span>Thread: <a href={complaint.threadUrl} className="text-[#1d9bf0] underline">{complaint.threadUrl}</a></span>
                    <span>Last updated: {new Date(complaint.updatedAt).toLocaleString()}</span>
                  </div>
                  {/* Admin actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line-soft)] pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] mr-2">
                      <MessageSquare size={10} className="inline mr-1" />
                      Action:
                    </p>
                    {complaint.status !== "under_review" && (
                      <button
                        onClick={() => setStatus(complaint.id, "under_review")}
                        className="rounded border border-[#ffb34744] bg-[#ffb34715] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ffd28e] transition-colors hover:bg-[#ffb34730]"
                      >
                        Mark In Review
                      </button>
                    )}
                    {complaint.status !== "resolved" && (
                      <button
                        onClick={() => setStatus(complaint.id, "resolved")}
                        className="rounded border border-[#2ecf8744] bg-[#2ecf8715] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#5de6a7] transition-colors hover:bg-[#2ecf8730]"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {complaint.status !== "dismissed" && (
                      <button
                        onClick={() => setStatus(complaint.id, "dismissed")}
                        className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        Dismiss
                      </button>
                    )}
                    {complaint.status !== "open" && (
                      <button
                        onClick={() => setStatus(complaint.id, "open")}
                        className="rounded border border-[#ff4b5544] bg-[#ff4b5515] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ff9ea3] transition-colors hover:bg-[#ff4b5530]"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
