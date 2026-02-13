"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/app/components/PageLoader";
import FormInput from "@/app/components/FormInput";
import { GameButton } from "@/app/components/ui";

/* ────────────────── Login Form ────────────────── */

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/hub";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      const syncRes = await fetch("/api/auth/sync-user", { method: "POST" });
      if (!syncRes.ok) {
        setError("Failed to sync user data.");
        return;
      }

      // Check if user has any characters — if not, send to onboarding
      try {
        const charRes = await fetch("/api/characters");
        const charData = await charRes.json();
        const hasCharacters = (charData.characters?.length ?? 0) > 0;
        router.push(hasCharacters ? redirect : "/onboarding");
      } catch {
        router.push(redirect);
      }
      router.refresh();
    } catch (unexpectedErr) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
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
              Welcome Back
            </h1>
            <p className="text-xs text-slate-500">Sign in to enter the arena</p>
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
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="••••••••"
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
                  Signing in…
                </span>
              ) : (
                "Enter the Arena"
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
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              aria-label="Sign in with Google"
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
                  Sign in with Google
                </span>
              )}
            </GameButton>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-amber-500 transition hover:text-amber-400"
            tabIndex={0}
          >
            Register
          </Link>
        </p>

      </div>
    </main>
  );
};

/* ────────────────── Page Export ────────────────── */

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🔑" text="Loading…" />}>
      <LoginForm />
    </Suspense>
  );
}
