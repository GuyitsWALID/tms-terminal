"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleBadges from "@/components/ui/RoleBadges";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchAuthStatus } from "@/lib/api/dataService";
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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    setProfileLoaded(false);
    if (!hasSupabaseClient) {
      setAuthState({ isAuthenticated: false });
      setErrorMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setProfileLoaded(true);
      return;
    }

    const status = await fetchAuthStatus();
    setAuthState(status);

    if (status.isAuthenticated) {
      try {
        const profileRes = await fetch("/api/profile", { cache: "no-store" });
        if (profileRes.ok) {
          const payload = (await profileRes.json()) as { profile: UserProfile };
          setProfileForm(toForm(payload.profile));
        } else {
          // fallback to status.profile if available
          setProfileForm(toForm(status.profile));
        }
      } catch {
        setProfileForm(toForm(status.profile));
      }
    } else {
      setProfileForm(emptyForm);
    }
    setProfileLoaded(true);
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
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include", cache: "no-store" });
      if (typeof window !== "undefined") {
        const keys = Object.keys(window.localStorage);
        keys.forEach((key) => {
          if (key.startsWith("sb-") || key.startsWith("supabase.auth")) {
            window.localStorage.removeItem(key);
          }
        });
        const sessionKeys = Object.keys(window.sessionStorage);
        sessionKeys.forEach((key) => {
          if (key.startsWith("sb-") || key.startsWith("supabase.auth")) {
            window.sessionStorage.removeItem(key);
          }
        });
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0]?.trim();
          if (name && name.startsWith("sb-")) {
            document.cookie = `${name}=; Max-Age=0; path=/;`;
          }
        });
      }
      setAuthState({ isAuthenticated: false });
      setProfileForm(emptyForm);
      setStatusMessage("Signed out.");
      window.location.href = "/api/auth/logout";
      return;
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setIsBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const ext = file.name.split(".").pop() || "png";
    const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw new Error("Avatar upload failed.");
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      let avatarUrl = profileForm.avatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profileForm,
          avatarUrl,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unable to update profile" }))) as { error?: string };
        throw new Error(payload.error ?? "Unable to update profile.");
      }

      const payload = (await res.json()) as { profile: UserProfile };
      setProfileForm(toForm(payload.profile));
      setAvatarFile(null);
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
      {!profileLoaded ? (
        <div className="ff-panel p-4 sm:p-6 text-sm text-[var(--ink-muted)]">Loading profile...</div>
      ) : null}
      <div className="ff-panel p-4 sm:p-6">
        <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none text-[var(--ink-primary)] sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Manage your account and XP profile.</p>
      </div>

      {profileLoaded && !authState.isAuthenticated ? (
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
      ) : profileLoaded ? (
        <>
          <div className="ff-panel p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--ink-muted)]">Email</p>
                <p className="mt-1 font-semibold text-[var(--ink-primary)]">{authState.email}</p>
              </div>
              <div className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
                <p className="text-[var(--ink-muted)]">Role</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-semibold text-[var(--ink-primary)]">{authState.profile?.role ?? "user"}</p>
                  <RoleBadges role={authState.profile?.role} isVerifiedAnalyst={authState.profile?.isVerifiedAnalyst} />
                </div>
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-[var(--line-soft)] bg-[var(--surface-1)]">
                {profileForm.avatarUrl ? (
                  <img src={profileForm.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[var(--ink-muted)]">No avatar</div>
                )}
              </div>
              <div className="grid gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-[var(--ink-muted)]"
                />
                <p className="text-xs text-[var(--ink-muted)]">Upload a new profile picture to replace your current avatar.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={profileForm.displayName}
                onChange={(e) => setProfileForm((current) => ({ ...current, displayName: e.target.value }))}
                placeholder="Display name"
                className="rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
                required
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

        </>
      ) : null}

      {statusMessage ? <p className="px-1 text-xs text-[#2fd488]">{statusMessage}</p> : null}
      {errorMessage ? <p className="px-1 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
    </div>
  );
}
