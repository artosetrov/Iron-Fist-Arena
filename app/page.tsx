import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600/3 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/ui/logo.png"
            alt="BumKnight Arena"
            width={320}
            height={320}
            priority
            className="mix-blend-lighten drop-shadow-[0_0_40px_rgba(217,119,6,0.3)]"
          />
          <p className="mt-4 max-w-xs font-display text-base text-slate-500">
            Battle, loot, and conquer in the ultimate browser PvP RPG
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-700" />
          <span className="text-xs text-slate-600">⚔</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-700" />
        </div>

        {/* CTA buttons */}
        <nav className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3.5 font-display text-lg tracking-wider text-white shadow-lg shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30"
            aria-label="Log In"
            tabIndex={0}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Enter the Arena
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 py-3.5 font-display text-lg tracking-wider text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800/80 hover:text-white"
            aria-label="Register"
            tabIndex={0}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create Account
          </Link>
        </nav>

        {/* Footer hint */}
        <p className="mt-4 text-[11px] text-slate-600">
          Free to play · No downloads required
        </p>
      </div>
    </main>
  );
}
