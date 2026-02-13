"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FormInput from "@/app/components/FormInput";
import { GameButton } from "@/app/components/ui";

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
        <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wider text-white">
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
            <h2 className="font-display text-base tracking-widest text-slate-300">
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
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-base font-bold uppercase tracking-wider text-white shadow-md shadow-amber-900/30 transition-all hover:from-amber-500 hover:to-orange-500 active:scale-[0.98]"
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/onboarding")}`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  };

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

      // Check if user has any characters — if not, send to onboarding
      try {
        const charRes = await fetch("/api/characters");
        const charData = await charRes.json();
        const hasCharacters = (charData.characters?.length ?? 0) > 0;
        router.push(hasCharacters ? "/hub" : "/onboarding");
      } catch {
        router.push("/onboarding");
      }
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
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
          <div className="relative flex flex-col items-center gap-2 border-b border-slate-700/50 px-6 py-5">
            <Link
              href="/"
              className="absolute left-4 top-4 inline-flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-400"
              tabIndex={0}
              aria-label="Back to Home"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Home
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
              Join the Arena
            </h1>
            <p className="text-xs text-slate-500">Create your account and start fighting</p>
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

            <GameButton
              size="lg"
              fullWidth
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </span>
              ) : (
                "Forge Your Legend"
              )}
            </GameButton>

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/50" />
              <span className="text-xs text-slate-500">or</span>
              <div className="h-px flex-1 bg-slate-700/50" />
            </div>

            <GameButton
              variant="secondary"
              size="lg"
              fullWidth
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              aria-label="Sign up with Google"
              tabIndex={0}
            >
              {googleLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connecting…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                    <path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.96 11.96 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.33l2.66-2.07v-1.17Z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </span>
              )}
            </GameButton>
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

      </div>
    </main>
  );
}
