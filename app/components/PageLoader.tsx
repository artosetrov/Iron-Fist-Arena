"use client";

import { useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────
 * PageLoader
 *
 * Minimalist medieval-themed loading screen.
 * Shows an icon/emoji, loading text, an animated progress bar,
 * and a rotating lore tip.
 * ──────────────────────────────────────────────────────────── */

const TIPS = [
  "The crowd is gathering...",
  "Stray City never sleeps...",
  "Fortune favors the bold...",
  "Legends are forged in battle...",
  "The Iron Fist Tournament begins...",
  "Every blade is a work of art...",
  "The Catacombs hunger for the brave...",
  "Even Hell couldn't hold us...",
  "Death is not the end. It's an inconvenience.",
  "Fight. Win. Survive. The rest is paperwork.",
];

/** Fake progress easing — fast start, slows near the end */
const easeProgress = (t: number): number => {
  if (t < 0.6) return t * 1.4; // 0 → 0.84 за 60% времени
  return 0.84 + (t - 0.6) * 0.4; // 0.84 → 1.0 за оставшиеся 40%
};

/** Duration of full progress bar fill (ms) */
const PROGRESS_DURATION = 4000;
/** Tick interval for progress update (ms) */
const TICK_MS = 50;

interface PageLoaderProps {
  /** Emoji displayed as the central icon */
  emoji?: string;
  /** ReactNode icon (e.g. GameIcon) — overrides emoji */
  icon?: React.ReactNode;
  /** Text displayed below the icon */
  text?: string;
}

const PageLoader = ({ emoji = "⚔️", icon, text = "Loading…" }: PageLoaderProps) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(Date.now());

  /* Set random starting tip + rotate lore tips */
  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * TIPS.length));
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  /* Animate progress bar */
  useEffect(() => {
    startRef.current = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const raw = Math.min(elapsed / PROGRESS_DURATION, 1);
      setProgress(easeProgress(raw));
      if (raw >= 1) clearInterval(tick);
    }, TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const percent = Math.round(progress * 100);

  return (
    <div className="relative flex min-h-full items-center justify-center bg-slate-950 overflow-hidden">
      {/* City background — darkened */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/images/buildings/Stray City.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
        {/* Icon — natural size when custom icon, else emoji */}
        <div className="flex h-48 w-48 items-center justify-center rounded-full border border-amber-900/40 bg-slate-900/80 shadow-lg shadow-amber-950/20">
          {icon ? (
            <span className="flex items-center justify-center">{icon}</span>
          ) : (
            <span className="text-6xl">{emoji}</span>
          )}
        </div>

        {/* Loading text */}
        <p className="font-display text-sm font-semibold tracking-wide text-slate-300">
          {text}
        </p>

        {/* Progress bar */}
        <div className="flex w-48 flex-col items-center gap-1.5">
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/50"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-[width] duration-100 ease-linear shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums font-medium text-slate-500">
            {percent}%
          </span>
        </div>

        {/* Lore tip */}
        <p className="max-w-xs text-xs italic text-slate-600 transition-opacity duration-700">
          &ldquo;{TIPS[tipIndex]}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
