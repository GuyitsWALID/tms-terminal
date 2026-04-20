"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import GoogleIcon from "@/components/ui/GoogleIcon";

export default function SignUpPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const onSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: displayName,
          },
        },
      });
      if (error) throw error;
      setStatusMessage("Sign-up successful. Redirecting to profile setup...");
      router.push("/profile");
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign up.");
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
    setStatusMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl place-items-center py-8">
      <section className="w-full max-w-md rounded-2xl border border-[var(--line-strong)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--surface-2)_96%,transparent),color-mix(in_srgb,var(--surface-1)_96%,transparent))] p-5 shadow-[0_20px_70px_color-mix(in_srgb,var(--bg-deep)_42%,transparent)] transition-colors sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--line-soft)] pb-4">
          <Image src="/TMSLOGO.png" alt="TMS logo" width={44} height={44} className="h-11 w-11 rounded-md object-cover" priority />
          <div>
            <p className="font-rajdhani text-2xl font-bold uppercase leading-none tracking-wide text-[var(--ink-primary)]">TMS Terminal</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">The Market Syndicate</p>
          </div>
        </div>

        <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">Sign Up</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Create your account and set up your profile.</p>

        <form className="mt-6 grid gap-3" onSubmit={onSignUp}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="h-11 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm text-[var(--ink-primary)] outline-none transition focus:border-[var(--brand)]"
            required
          />
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
            {isBusy ? "Creating..." : "Create Account"}
          </button>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={isBusy}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-primary)] transition hover:bg-[var(--surface-hover)]"
          >
            <GoogleIcon className="h-4 w-4" />
            Continue with Google
          </button>
        </form>

        <p className="mt-5 text-xs text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--ink-primary)] underline-offset-2 hover:underline">Login</Link>
        </p>

        {statusMessage ? <p className="mt-4 text-xs text-[#2fd488]">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-2 text-xs text-[#ff8f8f]">{errorMessage}</p> : null}
      </section>
    </div>
  );
}
