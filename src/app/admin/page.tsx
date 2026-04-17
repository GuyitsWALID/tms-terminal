"use client";

import { FormEvent, useEffect, useState } from "react";

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

type InviteCode = {
  code: string;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const loadTeamMembers = async () => {
    const res = await fetch("/api/admin/team", { cache: "no-store" });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({ error: "Unable to load team members" }))) as { error?: string };
      throw new Error(payload.error ?? "Unable to load team members");
    }

    const payload = (await res.json()) as { team: TeamMember[] };
    setTeamMembers(payload.team ?? []);
  };

  const loadInviteCodes = async () => {
    const res = await fetch("/api/admin/invite-codes", { cache: "no-store" });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({ error: "Unable to load invite codes" }))) as { error?: string };
      throw new Error(payload.error ?? "Unable to load invite codes");
    }
    const payload = (await res.json()) as { inviteCodes: InviteCode[] };
    setInviteCodes(payload.inviteCodes);
  };

  useEffect(() => {
    void loadTeamMembers().catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load team members.");
    });

    void loadInviteCodes().catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load invite codes.");
    });
  }, []);

  const updateTeamMember = async (memberId: string, updates: Partial<TeamMember>) => {
    setIsBusy(true);
    setStatusMessage("");
    setErrorMessage("");

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

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to update team member" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to update team member");
      }

      setStatusMessage("Team member updated.");
      await loadTeamMembers();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update team member.");
    } finally {
      setIsBusy(false);
    }
  };

  const createInviteCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxUses: maxUses.trim() ? Number(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to create invite code" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to create invite code");
      }

      setStatusMessage("Invite code created.");
      setMaxUses("");
      setExpiresAt("");
      await loadInviteCodes();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create invite code.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="ff-panel p-4 sm:p-6">
      <h1 className="font-rajdhani text-2xl font-bold uppercase text-[var(--ink-primary)] sm:text-3xl">Admin / Invite Codes</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">Team management, analyst onboarding, and operational controls.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
          <p className="text-[var(--ink-muted)]">Team Members</p>
          <p className="mt-1 text-xl font-bold text-[var(--ink-primary)]">{teamMembers.length}</p>
        </div>
        <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
          <p className="text-[var(--ink-muted)]">Verified Analysts</p>
          <p className="mt-1 text-xl font-bold text-[var(--ink-primary)]">{teamMembers.filter((member) => member.isVerifiedAnalyst).length}</p>
        </div>
        <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
          <p className="text-[var(--ink-muted)]">Active Invite Codes</p>
          <p className="mt-1 text-xl font-bold text-[var(--ink-primary)]">{inviteCodes.filter((code) => code.is_active).length}</p>
        </div>
      </div>

      <div className="mt-4 overflow-auto rounded border border-[var(--line-soft)]">
        <table className="min-w-full text-left text-xs text-[var(--ink-primary)]">
          <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">XP</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} className="border-t border-[var(--line-soft)]">
                <td className="px-3 py-2 font-semibold">{member.displayName}</td>
                <td className="px-3 py-2">{member.role}</td>
                <td className="px-3 py-2">{member.isVerifiedAnalyst ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{member.isActive ? "Active" : "Suspended"}</td>
                <td className="px-3 py-2">{member.xp}</td>
                <td className="px-3 py-2">{new Date(member.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        updateTeamMember(member.id, {
                          isVerifiedAnalyst: !member.isVerifiedAnalyst,
                          role: !member.isVerifiedAnalyst ? "analyst" : "user",
                        })
                      }
                      disabled={isBusy}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 text-[10px] uppercase tracking-wide"
                    >
                      {member.isVerifiedAnalyst ? "Revoke Analyst" : "Make Analyst"}
                    </button>
                    <button
                      onClick={() => updateTeamMember(member.id, { isActive: !member.isActive })}
                      disabled={isBusy}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 text-[10px] uppercase tracking-wide"
                    >
                      {member.isActive ? "Suspend" : "Activate"}
                    </button>
                    <button
                      onClick={() => updateTeamMember(member.id, { role: member.role === "admin" ? "user" : "admin" })}
                      disabled={isBusy}
                      className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-2 py-1 text-[10px] uppercase tracking-wide"
                    >
                      {member.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {teamMembers.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[var(--ink-muted)]" colSpan={7}>No team members found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form onSubmit={createInviteCode} className="mt-4 grid gap-2 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 sm:max-w-lg">
        <label className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">Max uses (optional)</label>
        <input
          type="number"
          min={1}
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
          placeholder="e.g. 5"
        />

        <label className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">Expires at (optional)</label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
        />

        <button
          type="submit"
          disabled={isBusy}
          className="mt-1 w-fit rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
        >
          {isBusy ? "Creating..." : "Create Invite Code"}
        </button>
      </form>

      {statusMessage ? <p className="mt-3 text-xs text-[#2fd488]">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-2 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}

      <div className="mt-4 overflow-auto rounded border border-[var(--line-soft)]">
        <table className="min-w-full text-left text-xs text-[var(--ink-primary)]">
          <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Uses</th>
              <th className="px-3 py-2">Expires</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {inviteCodes.map((row) => (
              <tr key={row.code} className="border-t border-[var(--line-soft)]">
                <td className="px-3 py-2 font-semibold">{row.code}</td>
                <td className="px-3 py-2">{row.is_active ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2">{row.used_count}{row.max_uses ? ` / ${row.max_uses}` : ""}</td>
                <td className="px-3 py-2">{row.expires_at ? new Date(row.expires_at).toLocaleString() : "-"}</td>
                <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {inviteCodes.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[var(--ink-muted)]" colSpan={5}>No invite codes yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
