"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const onSignIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const statusRes = await fetch("/api/auth/status", { cache: "no-store" });
      const statusPayload = (await statusRes.json()) as {
        isAuthenticated?: boolean;
        roles?: Array<"admin" | "va">;
        profile?: { role?: "user" | "analyst" | "admin" };
        error?: string;
      };

      const hasAdminRole = statusPayload?.roles?.includes("admin") || statusPayload?.profile?.role === "admin";

      if (!statusRes.ok || !statusPayload?.isAuthenticated || !hasAdminRole) {
        await supabase.auth.signOut();
        throw new Error(statusPayload?.error || "Admin role is required for this portal.");
      }

      setStatusMessage("Access granted. Redirecting...");
      router.push("/admin");
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-5xl place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-xl border border-[var(--line-strong)] bg-[var(--surface-1)] p-6 shadow-[0_20px_70px_color-mix(in_srgb,var(--bg-deep)_32%,transparent)]">
        <div className="mb-5 flex items-center gap-2 border-b border-[var(--line-soft)] pb-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#ff9d2d66] bg-[#ff9d2d1f] text-[#ffd28e]">
            <Shield size={16} />
          </span>
          <div>
            <h1 className="font-rajdhani text-2xl font-bold uppercase leading-none text-[var(--ink-primary)]">Admin Portal</h1>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)]">Restricted Access</p>
          </div>
        </div>

        <form onSubmit={onSignIn} className="grid gap-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email"
            required
            className="h-11 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--ink-primary)] outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            className="h-11 rounded border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--ink-primary)] outline-none"
          />

          <button
            type="submit"
            disabled={isBusy}
            className="mt-1 h-11 rounded bg-[var(--brand-strong)] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            {isBusy ? "Signing In..." : "Sign In as Admin"}
          </button>
        </form>

        {statusMessage ? <p className="mt-4 text-xs text-[#2fd488]">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-2 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
      </section>
    </div>
  );
}
