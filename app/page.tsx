import Image from "next/image";
import { HomeCTAButtons } from "./components/HomeCTAButtons";

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
        <HomeCTAButtons />

        {/* Footer hint */}
        <p className="mt-4 text-[11px] text-slate-600">
          Free to play · No downloads required
        </p>
      </div>
    </main>
  );
}
