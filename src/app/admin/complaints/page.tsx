"use client";

import { useEffect, useState } from "react";
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
  threadId?: string;
  threadTitle?: string;
  threadAuthorId?: string;
  threadUrl?: string;
  createdAt: string;
  updatedAt: string;
};

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
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all");
  const [query, setQuery] = useState("");
  const [threadFilter, setThreadFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [canModerate, setCanModerate] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/complaints", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load complaints");
      const data = (await res.json()) as { complaints: Complaint[] };
      setComplaints(data.complaints ?? []);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { roles?: Array<"admin" | "va">; profile?: { role?: "user" | "analyst" | "admin" } };
        const isAdmin = (data.roles ?? []).includes("admin") || data.profile?.role === "admin";
        setCanModerate(isAdmin);
      } catch {
        setCanModerate(false);
      }
    };
    void loadAccess();
  }, []);

  const setStatus = async (id: string, status: ComplaintStatus) => {
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to update complaint.");
      }
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c))
      );
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unable to update complaint.");
    }
  };

  const threadOptions = Array.from(new Set(complaints.map((c) => c.threadTitle).filter(Boolean))) as string[];

  const filtered = complaints.filter((c) => {
    const byStatus = statusFilter === "all" || c.status === statusFilter;
    const byThread = threadFilter === "all" || c.threadTitle === threadFilter;
    const q = query.trim().toLowerCase();
    const hay = `${c.summary} ${c.detail} ${c.category} ${c.threadTitle ?? ""}`.toLowerCase();
    const byQuery = !q || hay.includes(q);
    return byStatus && byThread && byQuery;
  });

  const openCount = complaints.filter((c) => c.status === "open").length;
  const reviewCount = complaints.filter((c) => c.status === "under_review").length;
  const totalCount = complaints.length;

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
          <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--ink-primary)]">
            {totalCount} Total
          </span>
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

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search complaints or thread..."
          className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 text-xs text-[var(--ink-primary)] outline-none"
        />
        <select
          value={threadFilter}
          onChange={(e) => setThreadFilter(e.target.value)}
          className="h-9 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 text-xs text-[var(--ink-primary)] outline-none"
        >
          <option value="all">All Threads</option>
          {threadOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
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
        {loading && (
          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
            Loading complaints…
          </div>
        )}
        {errorMsg && !loading && (
          <div className="rounded-lg border border-[#ff4b5544] bg-[#ff4b5515] px-4 py-3 text-xs text-[#ff9ea3]">
            {errorMsg}
          </div>
        )}
        {!loading && filtered.length === 0 && (
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
          const threadLink = complaint.threadUrl ?? (complaint.threadId ? `/forum/threads/${complaint.threadId}` : null);

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
                  <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                    Thread: {complaint.threadTitle ?? "Unknown Thread"}
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
                    <span>
                      Thread: {threadLink ? (
                        <a href={threadLink} className="text-[#1d9bf0] underline">{threadLink}</a>
                      ) : (
                        <span>—</span>
                      )}
                    </span>
                    <span>Last updated: {new Date(complaint.updatedAt).toLocaleString()}</span>
                  </div>
                  {/* Admin actions */}
                  {canModerate ? (
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
                  ) : (
                    <div className="border-t border-[var(--line-soft)] pt-3">
                      <p className="text-[11px] text-[var(--ink-muted)]">View-only access for VA users.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
