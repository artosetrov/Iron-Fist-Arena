"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FormInput from "@/app/components/FormInput";

/* ────────────────── Email Verification Screen ────────────────── */

const EmailVerificationNotice = ({ email }: { email: string }) => (
  <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-amber-500/8 blur-3xl" />
    </div>

    <div className="relative z-10 w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="inline-block text-5xl" role="img" aria-label="Email">
          📧
        </span>
        <h1 className="mt-4 text-2xl font-bold uppercase tracking-wider text-white">
          Verify Your Email
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          We sent a confirmation link to
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-400">{email}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <span className="text-sm">✅</span>
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Almost There!
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-amber-500">1.</span>
              <p>Check your inbox (and spam folder)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-amber-500">2.</span>
              <p>Click the confirmation link in the email</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-amber-500">3.</span>
              <p>Come back and log in to enter the arena!</p>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center">
            <p className="text-xs text-amber-400/80">
              The link expires in 24 hours. If you don&apos;t see it, check your spam folder.
            </p>
          </div>

          <Link
            href="/login"
            className="mt-2 block w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30"
            tabIndex={0}
          >
            Go to Login
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-600 transition hover:text-slate-400"
          tabIndex={0}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  </main>
);

/* ────────────────── Register Page ────────────────── */

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (signError) {
        setError(signError.message);
        return;
      }

      // Supabase returns user with empty identities when email confirmation is required
      const needsEmailConfirmation =
        data.user && (!data.user.identities || data.user.identities.length === 0 || !data.user.email_confirmed_at);

      if (needsEmailConfirmation) {
        setPendingVerification(true);
        return;
      }

      // Email already confirmed (e.g. confirmation disabled) — sync and redirect
      if (data.user) {
        await fetch("/api/auth/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.user.email,
            username: username || data.user.user_metadata?.username,
          }),
        });
      }
      router.push("/hub");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return <EmailVerificationNotice email={email} />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-4xl transition hover:scale-110" aria-label="Home" tabIndex={0}>
            ⚔️
          </Link>
          <h1 className="mt-3 text-2xl font-bold uppercase tracking-wider text-white">
            Join the Arena
          </h1>
          <p className="mt-1 text-xs text-slate-500">Create your account and start fighting</p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
          <div className="border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
                <span className="text-sm">✨</span>
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                Register
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="warrior@arena.com"
            />
            <FormInput
              label="Player Name"
              type="text"
              value={username}
              onChange={setUsername}
              autoComplete="username"
              minLength={2}
              maxLength={50}
              placeholder="Your battle name"
            />
            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={6}
              placeholder="Min. 6 characters"
            />

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center">
                <p className="text-xs text-red-400" role="alert">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30 disabled:opacity-50 disabled:hover:from-amber-600 disabled:hover:to-orange-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </span>
              ) : (
                "Forge Your Legend"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-amber-500 transition hover:text-amber-400"
            tabIndex={0}
          >
            Log In
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-600 transition hover:text-slate-400"
            tabIndex={0}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
