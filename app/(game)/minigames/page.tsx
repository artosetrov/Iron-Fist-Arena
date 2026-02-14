"use client";

import { Suspense, useRef, useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/app/components/PageHeader";
import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";

/* ────────────────── Constants ────────────────── */

const DRAG_THRESHOLD = 5;
/** Native image dimensions for aspect ratio */
const BG_WIDTH = 1024;
const BG_HEIGHT = 571;

/* ────────────────── Minigame Config ────────────────── */

type TavernActivity = {
  id: string;
  label: string;
  description: string;
  href: string;
  pinIcon: string;
  available: boolean;
  tag?: string;
  /** Pin position as % of background image */
  top: number;
  left: number;
  /** Glow hitbox as % of background */
  hitbox: { top: number; left: number; width: number; height: number };
};

/**
 * Coordinates mapped to the custom tavern interior background.
 *
 * Visual zones on the image:
 *   - Center table with map: Dungeon Rush (group planning an adventure)
 *   - Left table with dice/cups: Shell Game (gambling corner)
 *   - Lower-right barrel with gold: Gold Mine (idle income)
 *   - Lower-left glowing dice: Coin Flip (magic gambling)
 *   - Right side by fireplace: Dice Roll (fireside games)
 */
const ACTIVITIES: TavernActivity[] = [
  {
    id: "dungeon-rush",
    label: "Dungeon Rush",
    description: "5-wave PvE gauntlet. Fight mobs, earn XP and Gold!",
    href: "/minigames/dungeon-rush",
    pinIcon: "/images/minigames/pins/pin-dungeon-rush.png",
    available: true,
    tag: "3 Energy",
    top: 35,
    left: 48,
    hitbox: { top: 25, left: 30, width: 35, height: 45 },
  },
  {
    id: "shell-game",
    label: "Shell Game",
    description: "Find the ball under the right cup. Bet gold, track the shuffle, pick wisely!",
    href: "/minigames/shell-game",
    pinIcon: "/images/minigames/pins/pin-shell-game.png",
    available: true,
    tag: "x2 Payout",
    top: 38,
    left: 14,
    hitbox: { top: 25, left: 2, width: 25, height: 40 },
  },
  {
    id: "gold-mine",
    label: "Gold Mine",
    description: "Start mining and collect gold over time. Idle income!",
    href: "/minigames/gold-mine",
    pinIcon: "/images/minigames/pins/pin-gold-mine.png",
    available: true,
    tag: "Idle",
    top: 50,
    left: 82,
    hitbox: { top: 40, left: 72, width: 24, height: 35 },
  },
  {
    id: "coin-flip",
    label: "Coin Flip",
    description: "Heads or tails? Double or nothing!",
    href: "/minigames/coin-flip",
    pinIcon: "/images/minigames/pins/pin-coin-flip.png",
    available: false,
    tag: "Coming Soon",
    top: 65,
    left: 15,
    hitbox: { top: 55, left: 2, width: 25, height: 30 },
  },
  {
    id: "dice-roll",
    label: "Dice Roll",
    description: "Roll the dice and test your luck against the house.",
    href: "/minigames/dice-roll",
    pinIcon: "/images/minigames/pins/pin-dice-roll.png",
    available: false,
    tag: "Coming Soon",
    top: 28,
    left: 85,
    hitbox: { top: 15, left: 72, width: 24, height: 30 },
  },
];

/* ────────────────── Component ────────────────── */

const TavernContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragState = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, pointerId: 0 });
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);

  /* Center scroll on mount */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const buildHref = useCallback(
    (base: string) => {
      if (!characterId) return base;
      return `${base}?characterId=${characterId}`;
    },
    [characterId],
  );

  /* ── Google Maps style drag-to-scroll ── */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // Don't capture when clicking on a pin — let the button receive click
      if ((e.target as HTMLElement).closest("button[data-pin]")) return;
      const el = scrollRef.current;
      if (!el) return;
      setIsDragging(true);
      hasDragged.current = false;
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        pointerId: e.pointerId,
      };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const el = scrollRef.current;
      if (!el) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        hasDragged.current = true;
      }
      el.scrollLeft = dragState.current.scrollLeft - dx;
      el.scrollTop = dragState.current.scrollTop - dy;
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      hasDragged.current = false;
      scrollRef.current?.releasePointerCapture(e.pointerId);
    },
    [isDragging],
  );

  const handleActivityClick = useCallback(
    (activity: TavernActivity) => {
      if (hasDragged.current || !activity.available) return;
      router.push(buildHref(activity.href));
    },
    [router, buildHref],
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* PageHeader overlay — pointer-events-none чтобы пины под хедером оставались кликабельными */}
      <div className="absolute inset-x-0 top-0 z-20 h-fit shrink-0 p-4 lg:p-6 pointer-events-none">
        <PageHeader title="Tavern" passThroughOverlay />
      </div>

      {/* ── Scrollable tavern map (Google Maps style) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto scrollbar-hide select-none touch-pan-x touch-pan-y"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="region"
        aria-label="Mama Grog's Tavern"
        tabIndex={0}
      >
        {/* Map container — sized by background, all children in % */}
        <div
          className="relative"
          style={{
            height: "max(100%, 500px)",
            aspectRatio: `${BG_WIDTH} / ${BG_HEIGHT}`,
          }}
        >
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/minigames/tavern-interior.png"
            alt="Mama Grog's Tavern — Interior"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />

          {/* Warm vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-transparent to-amber-950/30 pointer-events-none" />

          {/* Hitbox glow overlays */}
          {ACTIVITIES.map((a) => {
            const isHovered = hoveredActivity === a.id;
            if (!isHovered || isDragging) return null;
            return (
              <div
                key={`glow-${a.id}`}
                className="absolute rounded-full pointer-events-none transition-opacity duration-300"
                style={{
                  top: `${a.top}%`,
                  left: `${a.left}%`,
                  width: "20%",
                  height: "20%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle at center, rgba(251,191,36,0.15) 0%, transparent 70%)",
                }}
              />
            );
          })}

          {/* Pin markers */}
          {ACTIVITIES.map((a) => {
            const isHovered = hoveredActivity === a.id;
            const isDisabled = !a.available;
            return (
              <button
                key={a.id}
                type="button"
                data-pin
                className="absolute outline-none bg-transparent"
                style={{
                  top: `${a.top}%`,
                  left: `${a.left}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: isDragging ? "grabbing" : isDisabled ? "not-allowed" : "pointer",
                  zIndex: isHovered ? 30 : 10,
                  opacity: isDisabled ? 0.5 : 1,
                }}
                onClick={() => handleActivityClick(a)}
                onMouseEnter={() => setHoveredActivity(a.id)}
                onMouseLeave={() => setHoveredActivity(null)}
                onFocus={() => setHoveredActivity(a.id)}
                onBlur={() => setHoveredActivity(null)}
                aria-label={a.label}
                tabIndex={0}
              >
                {/* Pin icon */}
                <div
                  className={`relative transition-all duration-200 ease-out ${
                    isHovered && !isDragging && !isDisabled
                      ? "-translate-y-2 scale-110 drop-shadow-[0_6px_16px_rgba(251,191,36,0.5)]"
                      : isDisabled
                        ? "grayscale drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        : "animate-hub-pin-float drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <Image
                    src={a.pinIcon}
                    alt={a.label}
                    width={128}
                    height={128}
                    draggable={false}
                    className="pointer-events-none h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32"
                    sizes="112px"
                  />
                </div>

                {/* Tag badge */}
                {a.tag && (
                  <span
                    className={`absolute -top-1 -right-1 z-10 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider whitespace-nowrap
                      ${a.available
                        ? "border border-amber-500/40 bg-amber-900/80 text-amber-300"
                        : "border border-slate-600/40 bg-slate-800/80 text-slate-500"
                      }
                    `}
                  >
                    {a.tag}
                  </span>
                )}

                {/* Tooltip */}
                <div
                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 rounded-xl border border-amber-500/30 bg-slate-900/95 px-4 py-3 shadow-xl shadow-amber-900/20 backdrop-blur-sm transition-all duration-200 pointer-events-none ${
                    isHovered && !isDragging
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  <h3 className="font-display text-sm font-bold text-amber-300">
                    {a.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {a.description}
                  </p>
                  {isDisabled && (
                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Coming Soon
                    </p>
                  )}
                  <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-amber-500/30 bg-slate-900/95" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MinigamesPage = () => (
  <Suspense fallback={<PageLoader icon={<GameIcon name="tavern" size={32} />} text="Entering the Tavern..." />}>
    <TavernContent />
  </Suspense>
);

export default MinigamesPage;
