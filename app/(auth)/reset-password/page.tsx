"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/app/components/PageLoader";
import FormInput from "@/app/components/FormInput";
import { GameButton } from "@/app/components/ui";

/* ────────────── Reset Password Form ────────────── */

const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      // Sign out so user logs in with the new password
      await supabase.auth.signOut();
      router.push("/login?message=password_reset");
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
              New Password
            </h1>
            <p className="text-center text-xs text-slate-500">
              Choose a strong password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <FormInput
              label="New Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={6}
            />
            <FormInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={6}
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
                  Resetting…
                </span>
              ) : (
                "Reset Password"
              )}
            </GameButton>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Back to{" "}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🔑" text="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
