"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────── Types ────────────────── */

type Rewards = {
  gold: number;
  xp: number;
  ratingChange: number;
  newRating: number;
  won: boolean;
};

type TrainingRewards = {
  xp: number;
  remaining: number;
  leveledUp: boolean;
};

type CombatResultModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  turns: number;
  rewards?: Rewards;
  trainingRewards?: TrainingRewards;
  flavorText?: string;
};

/* ────────────────── Flavor texts ────────────────── */

const WIN_FLAVORS = [
  "The enemy is vanquished! Glory to the victor!",
  "Another victory for your collection!",
  "Your foe was outmatched — great fight!",
  "A ruthless takedown. Well done!",
  "Victory is yours. The arena roars!",
];

const LOSS_FLAVORS = [
  "Defeat is a lesson. Come back stronger!",
  "The enemy proved mightier. Don't give up!",
  "Bad luck this time. Try again!",
  "Loss builds character.",
];

const DRAW_FLAVORS = [
  "The battle ended in a draw. Worthy opponents!",
  "Neither fighter could overcome the other.",
];

const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/* ────────────────── Component ────────────────── */

/** Staggered reveal: items appear one by one */
const useStaggeredReveal = (itemCount: number, open: boolean, delayMs = 200) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!open) {
      setVisibleCount(0);
      return;
    }
    // Start reveal after a short initial delay
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < itemCount; i++) {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 300 + i * delayMs));
    }
    return () => timers.forEach(clearTimeout);
  }, [open, itemCount, delayMs]);

  return visibleCount;
};

const CombatResultModal = ({
  open,
  onClose,
  title,
  turns,
  rewards,
  trainingRewards,
  flavorText,
}: CombatResultModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const rewardItemCount = rewards ? 3 : trainingRewards ? 2 : 0;
  const visibleRewards = useStaggeredReveal(rewardItemCount, open);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const isWin = title === "Victory!" || title === "Victory";
  const isDraw = title === "Draw";

  const bannerGradient = isWin
    ? "from-green-900/80 to-emerald-900/60"
    : isDraw
      ? "from-amber-900/80 to-yellow-900/60"
      : "from-red-900/80 to-rose-900/60";

  const bannerBorder = isWin
    ? "border-green-600/50"
    : isDraw
      ? "border-amber-600/50"
      : "border-red-600/50";

  const bannerIcon = isWin ? "⚔️" : isDraw ? "⚖️" : "💀";

  const titleColor = isWin
    ? "text-green-400"
    : isDraw
      ? "text-amber-400"
      : "text-red-400";

  const borderColor = isWin
    ? "border-green-700/40"
    : isDraw
      ? "border-amber-700/40"
      : "border-red-700/40";

  const flavor =
    flavorText ??
    (isWin
      ? pickRandom(WIN_FLAVORS)
      : isDraw
        ? pickRandom(DRAW_FLAVORS)
        : pickRandom(LOSS_FLAVORS));

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Combat Result"
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border ${borderColor} bg-slate-900 shadow-2xl`}
      >
        {/* Banner */}
        <div
          className={`relative flex flex-col items-center gap-2 border-b ${bannerBorder} bg-gradient-to-b ${bannerGradient} px-6 py-6`}
        >
          <span className="text-4xl" aria-hidden="true">
            {bannerIcon}
          </span>
          <h2
            className={`font-display text-3xl tracking-wider ${titleColor}`}
          >
            {title}
          </h2>
          <p className="text-xs text-slate-400">In {turns} turns</p>
        </div>

        {/* Flavor text */}
        <div className="px-6 py-4">
          <p className="text-center text-sm leading-relaxed text-slate-300">
            {flavor}
          </p>
        </div>

        {/* PvP Rewards — staggered reveal */}
        {rewards && (
          <div className="grid grid-cols-3 gap-2 border-t border-slate-800 px-6 py-4">
            <div
              className={`rounded-xl bg-amber-900/30 p-3 text-center transition-all duration-300 ${
                visibleRewards >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Gold
              </p>
              <p className="text-sm font-bold text-yellow-400">
                +{rewards.gold}
              </p>
            </div>
            <div
              className={`rounded-xl bg-blue-900/30 p-3 text-center transition-all duration-300 ${
                visibleRewards >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                XP
              </p>
              <p className="text-sm font-bold text-blue-400">+{rewards.xp}</p>
            </div>
            <div
              className={`rounded-xl bg-slate-800/60 p-3 text-center transition-all duration-300 ${
                visibleRewards >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Rating
              </p>
              <p
                className={`text-sm font-bold ${rewards.ratingChange >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {rewards.ratingChange >= 0 ? "+" : ""}
                {rewards.ratingChange} → {rewards.newRating}
              </p>
            </div>
          </div>
        )}

        {/* Training Rewards — staggered reveal */}
        {trainingRewards && (
          <div className="border-t border-slate-800 px-6 py-4">
            {trainingRewards.leveledUp && (
              <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-900/40 px-4 py-2.5 border border-amber-600/40 animate-bounce">
                <span className="text-lg" aria-hidden="true">🎉</span>
                <p className="text-sm font-bold text-amber-300">Level Up!</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl bg-blue-900/30 p-3 text-center transition-all duration-300 ${
                  visibleRewards >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  XP Earned
                </p>
                <p className={`text-sm font-bold ${trainingRewards.xp > 0 ? "text-blue-400" : "text-slate-500"}`}>
                  +{trainingRewards.xp}
                </p>
              </div>
              <div
                className={`rounded-xl bg-slate-800/60 p-3 text-center transition-all duration-300 ${
                  visibleRewards >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Remaining
                </p>
                <p
                  className={`text-sm font-bold ${
                    trainingRewards.remaining > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {trainingRewards.remaining} left
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-4">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="OK"
            className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:from-amber-500 hover:to-orange-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombatResultModal;
