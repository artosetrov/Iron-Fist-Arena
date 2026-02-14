"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/app/components/PageLoader";
import FormInput from "@/app/components/FormInput";
import { GameButton } from "@/app/components/ui";

/* ────────────── Forgot Password Form ────────────── */

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
        }
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
          <div className="relative flex flex-col items-center gap-2 border-b border-slate-700/50 px-6 py-5">
            <Link
              href="/login"
              className="absolute left-4 top-4 inline-flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-400"
              tabIndex={0}
              aria-label="Back to Login"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Login
            </Link>
            <Link href="/" className="inline-block transition hover:scale-110" aria-label="Home" tabIndex={0}>
              <Image
                src="/images/ui/logo.png"
                alt="Iron Fist Arena"
                width={80}
                height={80}
                priority
              />
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
              Reset Password
            </h1>
            <p className="text-center text-xs text-slate-500">
              Enter your email and we&apos;ll send a reset link
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Check your email</p>
                <p className="mt-1 text-xs text-slate-400">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-slate-300">{email}</span>
                </p>
              </div>
              <p className="text-center text-xs text-slate-500">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="font-medium text-amber-500 transition hover:text-amber-400"
                  tabIndex={0}
                  aria-label="Try again"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
              <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                placeholder="warrior@arena.com"
              />

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center">
                  <p className="text-xs text-red-400" role="alert">{error}</p>
                </div>
              )}

              <GameButton
                size="lg"
                fullWidth
                type="submit"
                disabled={loading}
                className="mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending…
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </GameButton>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-amber-500 transition hover:text-amber-400"
            tabIndex={0}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

/* ────────────────── Page Export ────────────────── */

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🔑" text="Loading…" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
