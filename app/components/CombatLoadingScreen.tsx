"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAssetUrl } from "@/lib/hooks/useAssetOverrides";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

/* ────────────────────────────────────────────────────────────
 * CombatLoadingScreen
 *
 * Animated loading screen shown while the API calculates the
 * battle and VFX assets are preloading into browser cache.
 * Features arena background, VS display, and rotating tips.
 * ──────────────────────────────────────────────────────────── */

const TIPS = [
  "Sharpen your blade...",
  "The enemy awaits...",
  "Study your opponent's weakness...",
  "Fortune favors the bold...",
  "May the crits be in your favor...",
  "Stretch before you fight...",
  "Check your armor for dents...",
  "The crowd is gathering...",
];

const PRESET_ICONS: Record<string, GameIconKey> = {
  warrior: "warrior",
  rogue: "rogue",
  mage: "mage",
  tank: "tank",
};

type CombatLoadingScreenProps = {
  preset: string;
};

const CombatLoadingScreen = ({ preset }: CombatLoadingScreenProps) => {
  const [tipIndex, setTipIndex] = useState(
    () => Math.floor(Math.random() * TIPS.length),
  );
  const [dots, setDots] = useState("");

  /* Rotate tips every 2.5s */
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* Animate dots */
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const iconKey = PRESET_ICONS[preset] ?? "warrior";
  const arenaBgUrl = useAssetUrl("ui/arena-background", "/images/ui/arena-background.png");

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4">
      {/* Background image */}
      <Image
        src={arenaBgUrl}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        priority
        aria-hidden="true"
        unoptimized={arenaBgUrl.startsWith("http")}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/65 to-slate-950/85"
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl sm:h-64 sm:w-64"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Fighters silhouettes */}
        <div className="mb-6 flex items-center gap-6 sm:mb-8 sm:gap-8">
          {/* Player silhouette */}
          <div className="flex h-24 w-18 items-center justify-center rounded-2xl border border-slate-600/40 bg-slate-800/50 shadow-lg shadow-amber-900/20 backdrop-blur-sm sm:h-32 sm:w-24">
            <span className="opacity-70"><GameIcon name="rogue" size={48} /></span>
          </div>

          {/* VS pulse */}
          <div className="relative">
            <span className="font-display text-2xl font-bold text-amber-500 animate-pulse sm:text-3xl">
              VS
            </span>
            {/* Glow ring */}
            <div className="absolute inset-0 -m-2 rounded-full bg-amber-500/15 blur-xl" />
          </div>

          {/* Enemy silhouette */}
          <div className="flex h-24 w-18 items-center justify-center rounded-2xl border border-slate-600/40 bg-slate-800/50 shadow-lg shadow-red-900/20 backdrop-blur-sm sm:h-32 sm:w-24">
            <span className="opacity-70"><GameIcon name={iconKey} size={48} /></span>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="mb-3 font-display text-lg font-bold tracking-wide text-slate-200 sm:text-xl">
          PREPARING BATTLE{dots}
        </h2>

        {/* Progress bar (indeterminate) */}
        <div className="mb-5 h-1.5 w-40 overflow-hidden rounded-full bg-slate-700/50 sm:mb-6 sm:w-48">
          <div className="h-full w-1/3 animate-[loading-slide_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>

        {/* Tip */}
        <p className="text-center text-xs text-slate-500 transition-opacity duration-300 sm:text-sm">
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};

export default CombatLoadingScreen;
