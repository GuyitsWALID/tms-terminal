"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchAuthStatus, redeemAnalystInviteCode } from "@/lib/api/dataService";
import type { AuthStatus, MarketKey, UserProfile } from "@/types";

type EditableProfileState = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  timezone: string;
  specialization: string;
  favoriteMarket: MarketKey | "";
};

const emptyForm: EditableProfileState = {
  displayName: "",
  avatarUrl: "",
  bio: "",
  timezone: "",
  specialization: "",
  favoriteMarket: "",
};

const toForm = (profile?: UserProfile): EditableProfileState => ({
  displayName: profile?.displayName ?? "",
  avatarUrl: profile?.avatarUrl ?? "",
  bio: profile?.bio ?? "",
  timezone: profile?.timezone ?? "",
  specialization: profile?.specialization ?? "",
  favoriteMarket: profile?.favoriteMarket ?? "",
});

export default function ProfilePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const hasSupabaseClient = Boolean(supabase);
  const [authState, setAuthState] = useState<AuthStatus>({ isAuthenticated: false });
  const [profileForm, setProfileForm] = useState<EditableProfileState>(emptyForm);
  const [inviteCode, setInviteCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!hasSupabaseClient) {
      setAuthState({ isAuthenticated: false });
      setErrorMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const status = await fetchAuthStatus();
    setAuthState(status);

    if (status.isAuthenticated) {
      const profileRes = await fetch("/api/profile", { cache: "no-store" });
      if (profileRes.ok) {
        const payload = (await profileRes.json()) as { profile: UserProfile };
        setProfileForm(toForm(payload.profile));
      } else {
        setProfileForm(toForm(status.profile));
      }
    } else {
      setProfileForm(emptyForm);
    }
  }, [hasSupabaseClient]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const onSignOut = async () => {
    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setStatusMessage("Signed out.");
      await refreshStatus();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setIsBusy(false);
    }
  };

  const onRedeemInvite = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await redeemAnalystInviteCode(inviteCode);
      setStatusMessage("Invite code accepted. Your analyst account is now verified.");
      setInviteCode("");
      await refreshStatus();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to redeem invite code.");
    } finally {
      setIsBusy(false);
    }
  };

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to update profile" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to update profile.");
      }

      const payload = (await res.json()) as { profile: UserProfile };
      setProfileForm(toForm(payload.profile));
      setStatusMessage("Profile updated.");
      await refreshStatus();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="ff-panel p-4 sm:p-6">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none text-[var(--ink-primary)] sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Manage your account, XP profile, and analyst onboarding.</p>
      </div>

      {!authState.isAuthenticated ? (
        <div className="ff-panel p-4 sm:p-6">
          <p className="text-sm text-[var(--ink-muted)]">You are currently signed out.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]">
              Login
            </Link>
            <Link href="/signup" className="rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
              Sign Up
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="ff-panel p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--ink-muted)]">Email</p>
                <p className="mt-1 font-semibold text-[var(--ink-primary)]">{authState.email}</p>
              </div>
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--ink-muted)]">Role</p>
                <p className="mt-1 font-semibold text-[var(--ink-primary)]">{authState.profile?.role ?? "user"}</p>
              </div>
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--ink-muted)]">Rank / XP</p>
                <p className="mt-1 font-semibold text-[var(--ink-primary)]">{authState.profile?.rank ?? "Novice"} / {authState.profile?.xp ?? 0}</p>
              </div>
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--ink-muted)]">Verified Analyst</p>
                <p className="mt-1 font-semibold text-[var(--ink-primary)]">{authState.profile?.isVerifiedAnalyst ? "Yes" : "No"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              disabled={isBusy}
              className="mt-4 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]"
            >
              Sign Out
            </button>
          </div>

          <form className="ff-panel grid gap-3 p-4 sm:p-6" onSubmit={onSaveProfile}>
            <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Profile Details</h2>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={profileForm.displayName}
                onChange={(e) => setProfileForm((current) => ({ ...current, displayName: e.target.value }))}
                placeholder="Display name"
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
                required
              />
              <input
                value={profileForm.avatarUrl}
                onChange={(e) => setProfileForm((current) => ({ ...current, avatarUrl: e.target.value }))}
                placeholder="Avatar URL"
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
              />
              <input
                value={profileForm.timezone}
                onChange={(e) => setProfileForm((current) => ({ ...current, timezone: e.target.value }))}
                placeholder="Timezone (e.g. UTC+3)"
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
              />
              <input
                value={profileForm.specialization}
                onChange={(e) => setProfileForm((current) => ({ ...current, specialization: e.target.value }))}
                placeholder="Specialization"
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
              />
              <select
                value={profileForm.favoriteMarket}
                onChange={(e) => setProfileForm((current) => ({ ...current, favoriteMarket: e.target.value as MarketKey | "" }))}
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
              >
                <option value="">Favorite Market</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="commodities">Commodities</option>
              </select>
            </div>

            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm((current) => ({ ...current, bio: e.target.value }))}
              placeholder="Bio"
              className="min-h-[100px] rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
            />

            <button
              type="submit"
              disabled={isBusy}
              className="w-fit rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
            >
              {isBusy ? "Saving..." : "Save Profile"}
            </button>
          </form>

          {!authState.profile?.isVerifiedAnalyst ? (
            <form className="ff-panel grid gap-2 p-4 sm:max-w-xl sm:p-6" onSubmit={onRedeemInvite}>
              <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Verified Analyst Access</h2>
              <label className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">Analyst invite code</label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
                required
              />
              <button
                type="submit"
                disabled={isBusy}
                className="w-fit rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
              >
                Redeem Code
              </button>
            </form>
          ) : null}
        </>
      )}

      {statusMessage ? <p className="px-1 text-xs text-[#2fd488]">{statusMessage}</p> : null}
      {errorMessage ? <p className="px-1 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
    </div>
  );
}
