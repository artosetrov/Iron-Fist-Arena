import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* City background */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/buildings/Stray City.png"
          alt=""
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950" />
      </div>

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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-base font-bold uppercase tracking-wider text-white shadow-md shadow-amber-900/30 transition-all hover:from-amber-500 hover:to-orange-500 active:scale-[0.98]"
            aria-label="Log In"
            tabIndex={0}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2v12M12 14l-2.5 2M12 14l2.5 2" />
              <path d="M9 14h6M10.5 14v6M13.5 14v6" />
            </svg>
            Enter the Arena
          </Link>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-base font-bold uppercase tracking-wider text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
            aria-label="Register"
            tabIndex={0}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2L4 6v4c0 5.5 3.5 10 8 12 4.5-2 8-6.5 8-12V6L12 2z" />
              <path d="M12 9v4M10 11h4" />
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
