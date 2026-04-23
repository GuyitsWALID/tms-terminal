"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Search, ShieldOff, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type TeamMember = {
  id: string;
  displayName: string;
  role: "user" | "analyst" | "admin";
  isVerifiedAnalyst: boolean;
  specialization: string | null;
  isActive: boolean;
  xp: number;
  createdAt: string;
};

const ROLE_BADGE: Record<TeamMember["role"], string> = {
  admin: "bg-[#ff4b5522] text-[#ff8a8f] border border-[#ff4b5544]",
  analyst: "bg-[#2ecf8722] text-[#5de6a7] border border-[#2ecf8744]",
  user: "bg-[var(--surface-3)] text-[var(--ink-muted)] border border-[var(--line-soft)]",
};

export default function AdminUsersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "analyst" | "user">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/admin/team", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load users");
      const data = (await res.json()) as { team: TeamMember[] };
      setMembers(data.team ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (memberId: string, updates: Partial<TeamMember>) => {
    setBusy(memberId);
    setStatusMsg("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: memberId,
          role: updates.role,
          isVerifiedAnalyst: updates.isVerifiedAnalyst,
          isActive: updates.isActive,
          specialization: updates.specialization ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      setStatusMsg("User updated successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search || m.displayName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">
            Users & Team
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage roles, analyst verification, and account status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--ink-muted)]">
            Total: <strong className="text-[var(--ink-primary)]">{members.length}</strong>
          </span>
          <span className="rounded border border-[#2ecf8744] bg-[#2ecf8715] px-2.5 py-1 text-xs text-[#5de6a7]">
            Analysts: <strong>{members.filter((m) => m.isVerifiedAnalyst).length}</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="h-9 w-full rounded border border-[var(--line-soft)] bg-[var(--surface-1)] pl-9 pr-3 text-xs text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--ring-accent)]"
          />
        </div>
        <div className="inline-flex overflow-hidden rounded border border-[var(--line-soft)]">
          {(["all", "admin", "analyst", "user"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide",
                roleFilter === r
                  ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                  : "bg-[var(--surface-1)] text-[var(--ink-muted)]",
                r !== "all" && "border-l border-[var(--line-soft)]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && <p className="text-xs text-[#2ecf87]">{statusMsg}</p>}
      {error && <p className="text-xs text-[#ff8f8f]">{error}</p>}

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-[var(--line-soft)] bg-[var(--surface-1)]">
        <table className="min-w-[800px] w-full text-left text-xs">
          <thead className="border-b border-[var(--line-strong)] bg-[var(--surface-header)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">User</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Verified</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide text-right">XP</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line-soft)]">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--ink-muted)]">
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--ink-muted)]">
                  No users found.
                </td>
              </tr>
            )}
            {filtered.map((member) => (
              <tr
                key={member.id}
                className={cn(
                  "transition-colors hover:bg-[var(--surface-hover)]",
                  !member.isActive && "opacity-50"
                )}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-[var(--ink-primary)]">{member.displayName}</p>
                    {member.specialization && (
                      <p className="text-[10px] text-[var(--ink-muted)]">{member.specialization}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", ROLE_BADGE[member.role])}>
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {member.isVerifiedAnalyst ? (
                    <BadgeCheck size={14} className="text-[#2ecf87]" />
                  ) : (
                    <span className="text-[var(--ink-muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                      member.isActive
                        ? "bg-[#2ecf8715] text-[#5de6a7]"
                        : "bg-[#ff4b5515] text-[#ff9ea3]"
                    )}
                  >
                    {member.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--ink-primary)]">
                  {member.xp.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() =>
                        update(member.id, {
                          isVerifiedAnalyst: !member.isVerifiedAnalyst,
                          role: !member.isVerifiedAnalyst ? "analyst" : "user",
                        })
                      }
                      disabled={busy === member.id}
                      className="flex items-center gap-1 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
                    >
                      {member.isVerifiedAnalyst ? (
                        <><ShieldOff size={10} /> Revoke VA</>
                      ) : (
                        <><UserCheck size={10} /> Make VA</>
                      )}
                    </button>
                    <button
                      onClick={() => update(member.id, { isActive: !member.isActive })}
                      disabled={busy === member.id}
                      className={cn(
                        "flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50",
                        member.isActive
                          ? "border-[#ff4b5544] bg-[#ff4b5510] text-[#ff9ea3] hover:bg-[#ff4b5525]"
                          : "border-[#2ecf8744] bg-[#2ecf8710] text-[#5de6a7] hover:bg-[#2ecf8725]"
                      )}
                    >
                      {member.isActive ? <><UserX size={10} /> Suspend</> : <><UserCheck size={10} /> Activate</>}
                    </button>
                    <button
                      onClick={() =>
                        update(member.id, {
                          role: member.role === "admin" ? "user" : "admin",
                        })
                      }
                      disabled={busy === member.id}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
                    >
                      {member.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
