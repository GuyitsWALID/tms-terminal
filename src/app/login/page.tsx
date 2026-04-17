"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
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
      setStatusMessage("Signed in. Redirecting...");
      router.push(redirectTo);
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsBusy(false);
    }
  };

  const onGoogleSignIn = async () => {
    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl place-items-center py-8">
      <section className="w-full max-w-md rounded-2xl border border-[var(--line-strong)] bg-[linear-gradient(160deg,rgba(18,28,48,0.92),rgba(9,16,32,0.96))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--line-soft)] pb-4">
          <Image src="/TMSLOGO.png" alt="TMS logo" width={44} height={44} className="h-11 w-11 rounded-md object-cover" priority />
          <div>
            <p className="font-rajdhani text-2xl font-bold uppercase leading-none tracking-wide text-[var(--ink-primary)]">TMS Terminal</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">The Market Syndicate</p>
          </div>
        </div>

        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">Login</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Access your trading workspace.</p>

        <form className="mt-6 grid gap-3" onSubmit={onSignIn}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-11 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--ink-primary)] outline-none transition focus:border-[var(--brand)]"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-11 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--ink-primary)] outline-none transition focus:border-[var(--brand)]"
            required
          />

          <button
            type="submit"
            disabled={isBusy}
            className="mt-1 h-11 rounded-lg bg-[var(--brand-strong)] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:opacity-95"
          >
            {isBusy ? "Signing In..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={isBusy}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-primary)] transition hover:bg-[var(--surface-hover)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.3 0-5.9-2.7-5.9-6.1s2.6-6.1 5.9-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 2.9 14.6 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12Z"/>
              <path fill="#34A853" d="M2.8 7.2 6 9.6C6.8 7.4 8.9 5.8 12 5.8c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 2.9 14.6 2 12 2 8.4 2 5.2 4.1 3.6 7.2Z"/>
              <path fill="#FBBC05" d="M12 20.4c2.5 0 4.6-.8 6.1-2.3l-2.8-2.3c-.8.6-1.9 1-3.3 1-3 0-5.2-2-6-4.6l-3.2 2.5C4.3 18 7.9 20.4 12 20.4Z"/>
              <path fill="#4285F4" d="M21.1 13.1c0-.5 0-.9-.1-1.3H12v3.9h5.4c-.3 1.3-1.1 2.2-2.1 2.9l2.8 2.3c1.6-1.5 3-3.8 3-7.8Z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-5 text-xs text-[var(--ink-muted)]">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-[var(--ink-primary)] underline-offset-2 hover:underline">Create one</Link>
        </p>

        {statusMessage ? <p className="mt-4 text-xs text-[#2fd488]">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-2 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
      </section>
    </div>
  );
}
