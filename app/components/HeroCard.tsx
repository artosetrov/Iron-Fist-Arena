"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { getRankFromRating } from "@/lib/game/elo";

/* ────────────────── Shared Constants ────────────────── */

export const CLASS_ICON: Record<string, string> = {
  warrior: "⚔️",
  rogue: "🗡️",
  mage: "🔮",
  tank: "🛡️",
};

export const CLASS_GRADIENT: Record<string, string> = {
  warrior: "from-red-900 to-red-950",
  rogue: "from-emerald-900 to-emerald-950",
  mage: "from-blue-900 to-blue-950",
  tank: "from-amber-900 to-amber-950",
};

export const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/generated/origin-human.png",
  orc: "/images/generated/origin-orc.png",
  skeleton: "/images/generated/origin-skeleton.png",
  demon: "/images/generated/origin-demon.png",
  dogfolk: "/images/generated/origin-dogfolk.png",
};

export const BOSS_IMAGES: Record<string, string> = {
  "Straw Dummy": "/images/generated/boss-straw-dummy.png",
  "Rusty Automaton": "/images/generated/boss-rusty-automaton.png",
  "Barrel Golem": "/images/generated/boss-barrel-golem.png",
  "Plank Knight": "/images/generated/boss-plank-knight.png",
  "Flying Francis": "/images/generated/boss-flying-francis.png",
  "Scarecrow Mage": "/images/generated/boss-scarecrow-mage.png",
  "Mud Troll": "/images/generated/boss-mud-troll.png",
  "Possessed Mannequin": "/images/generated/boss-possessed-mannequin.png",
  "Iron Dummy": "/images/generated/boss-iron-dummy.png",
  "Drill Sergeant Grizzle": "/images/generated/boss-drill-sergeant-grizzle.png",
};

/* ────────────────── Card Frame Colors ────────────────── */

const CLASS_FRAME: Record<string, { border: string; glow: string; accent: string }> = {
  warrior: {
    border: "border-red-700/80",
    glow: "shadow-red-600/40",
    accent: "from-red-800 via-red-900 to-red-950",
  },
  rogue: {
    border: "border-emerald-700/80",
    glow: "shadow-emerald-600/40",
    accent: "from-emerald-800 via-emerald-900 to-emerald-950",
  },
  mage: {
    border: "border-blue-700/80",
    glow: "shadow-blue-600/40",
    accent: "from-blue-800 via-blue-900 to-blue-950",
  },
  tank: {
    border: "border-amber-700/80",
    glow: "shadow-amber-600/40",
    accent: "from-amber-800 via-amber-900 to-amber-950",
  },
};

const DEFAULT_FRAME = {
  border: "border-slate-600/80",
  glow: "shadow-slate-600/40",
  accent: "from-slate-700 via-slate-800 to-slate-900",
};

/* ────────────────── Stat Circle ────────────────── */

type StatCircleProps = {
  value: number;
  icon: string;
  color: string;
  label: string;
  size?: "sm" | "md";
};

/** Short abbreviation shown below the stat circle */
const STAT_ABBR: Record<string, string> = {
  Strength: "STR",
  Agility: "AGI",
  Intelligence: "INT",
  Vitality: "VIT",
  Luck: "LCK",
  Endurance: "END",
  Wisdom: "WIS",
  Charisma: "CHA",
};

const StatCircle = ({ value, color, label, size = "md" }: StatCircleProps) => {
  const [hovered, setHovered] = useState(false);
  const sizeClasses = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  const abbr = STAT_ABBR[label] ?? label.slice(0, 3).toUpperCase();

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`${sizeClasses} flex items-center justify-center rounded-full border-2 ${color} bg-slate-900/90 font-bold tabular-nums text-white shadow-md transition-transform hover:scale-110`}
      >
        {value}
      </div>
      <span className="mt-0.5 text-[8px] font-semibold uppercase leading-none tracking-wide text-slate-500">
        {abbr}
      </span>
      {hovered && (
        <div className="pointer-events-none absolute -top-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-slate-300 shadow-lg border border-slate-700">
          {label}: {value}
        </div>
      )}
    </div>
  );
};

/* ────────────────── HP Bar ────────────────── */

type HpBarProps = { current: number; max: number };

const HpBar = ({ current, max }: HpBarProps) => {
  const clamped = Math.max(0, Math.min(max, current));
  const pct = max > 0 ? Math.max(0, Math.min(100, (clamped / max) * 100)) : 0;
  const barColor =
    pct > 60
      ? "from-green-600 to-green-500"
      : pct > 30
        ? "from-orange-600 to-orange-500"
        : "from-red-700 to-red-500";

  return (
    <div className="relative h-7 w-full overflow-hidden rounded-full border border-slate-600/80 bg-slate-900/80">
      <div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {clamped.toLocaleString()} / {max.toLocaleString()}
      </span>
    </div>
  );
};

/* ────────────────── Rating Badge ────────────────── */

const RatingBadge = ({ rating }: { rating: number }) => {
  const [hovered, setHovered] = useState(false);
  const rank = getRankFromRating(rating);

  return (
    <div
      className="absolute left-2 top-2 z-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-red-500/80 bg-slate-900/90 text-base font-bold tabular-nums text-red-400 shadow-lg">
        {rating}
      </div>
      {hovered && (
        <div className="pointer-events-none absolute -bottom-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-medium text-red-300 shadow-lg">
          {rank}
        </div>
      )}
    </div>
  );
};

/* ────────────────── HeroCard Props ────────────────── */

export type HeroCardProps = {
  /** Card display name */
  name: string;
  /** Class: warrior, rogue, mage, tank */
  className?: string;
  /** Origin: human, orc, skeleton, etc. (for origin images) */
  origin?: string;
  /** Level number */
  level?: number;
  /** Whether card is selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** PvP rating to display */
  rating?: number;
  /** HP bar: current and max HP */
  hp?: { current: number; max: number };
  /** Stats to display in circles at bottom */
  stats?: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    vitality?: number;
    luck?: number;
    endurance?: number;
    wisdom?: number;
    charisma?: number;
  };
  /** Short description (for training dummies, bosses) */
  description?: string;
  /** Custom emoji icon (overrides class icon, only used if no image) */
  icon?: string;
  /** Custom image source (overrides boss/origin lookup) */
  imageSrc?: string;
  /** Battle-mode: fighter card with shake/dodge animations */
  battle?: {
    isShaking: boolean;
    isDodging: boolean;
    side: "left" | "right";
  };
  /** Stat circle size */
  statSize?: "sm" | "md";
  /** Disable hover/click effects */
  disabled?: boolean;
  /** Aria label override */
  ariaLabel?: string;
  /** Children rendered below stats (e.g. action buttons) */
  children?: React.ReactNode;
};

/* ────────────────── HeroCard Component ────────────────── */

const HeroCard = memo(({
  name,
  className: cls,
  origin,
  level,
  selected = false,
  onClick,
  rating,
  hp,
  stats,
  description,
  icon,
  imageSrc,
  battle,
  statSize = "md",
  disabled = false,
  ariaLabel,
  children,
}: HeroCardProps) => {
  const classKey = cls?.toLowerCase() ?? "";
  const frame = CLASS_FRAME[classKey] ?? DEFAULT_FRAME;
  const gradient = CLASS_GRADIENT[classKey] ?? "from-slate-800 to-slate-900";
  const classIcon = icon ?? CLASS_ICON[classKey] ?? "👤";

  // Determine which image to show
  const resolvedImage = imageSrc ?? BOSS_IMAGES[name] ?? (origin ? ORIGIN_IMAGE[origin] : undefined);
  const isBossImage = Boolean(imageSrc || BOSS_IMAGES[name]);
  const isOriginImage = !isBossImage && Boolean(origin && ORIGIN_IMAGE[origin]);

  // Battle animations
  const shakeClass = battle?.isShaking ? "animate-combat-shake" : "";
  const dodgeClass = battle?.isDodging ? "animate-dodge-slide" : "";

  // Selected / hover states
  const selectedBorder = selected
    ? "border-amber-500 ring-2 ring-amber-400/50 shadow-xl shadow-amber-600/30 scale-[1.03]"
    : `${frame.border} hover:border-amber-600/50`;

  // Stat config
  const statConfig = [
    { key: "strength", icon: "⚔️", color: "border-red-500", label: "Strength" },
    { key: "agility", icon: "🏃", color: "border-emerald-500", label: "Agility" },
    { key: "intelligence", icon: "🧠", color: "border-blue-500", label: "Intelligence" },
    { key: "vitality", icon: "❤️", color: "border-pink-500", label: "Vitality" },
    { key: "luck", icon: "🍀", color: "border-amber-500", label: "Luck" },
    { key: "endurance", icon: "🛡️", color: "border-orange-500", label: "Endurance" },
    { key: "wisdom", icon: "📖", color: "border-indigo-500", label: "Wisdom" },
    { key: "charisma", icon: "✨", color: "border-purple-500", label: "Charisma" },
  ] as const;

  const visibleStats = stats
    ? statConfig.filter((s) => (stats as Record<string, number | undefined>)[s.key] !== undefined)
    : [];

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel ?? `${name}${onClick ? " — click to select" : ""}`}
      aria-pressed={onClick ? selected : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        group relative flex aspect-[9/14] flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300
        ${selectedBorder}
        ${shakeClass} ${dodgeClass}
        ${disabled ? "opacity-60 cursor-not-allowed" : onClick ? "cursor-pointer" : ""}
        bg-slate-950/90
      `}
    >
      {/* ═══ Top ornament strip ═══ */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${frame.accent}`} />

      {/* ═══ Portrait area ═══ */}
      <div
        className={`relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b ${gradient}`}
      >
        {/* Inner vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />

        {/* Image / Icon */}
        {resolvedImage ? (
          isBossImage ? (
            <Image
              src={resolvedImage}
              alt={name}
              width={1024}
              height={1024}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              sizes="220px"
            />
          ) : isOriginImage ? (
            <Image
              src={resolvedImage}
              alt={origin ?? name}
              width={1024}
              height={1024}
              className="absolute left-1/2 -top-3 z-10 w-[280%] max-w-none -translate-x-1/2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              sizes="380px"
            />
          ) : (
            <Image
              src={resolvedImage}
              alt={name}
              width={1024}
              height={1024}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              sizes="220px"
            />
          )
        ) : (
          <Image
            src="/images/generated/placeholder-silhouette.png"
            alt={name}
            width={1024}
            height={1024}
            className="relative z-10 h-full w-full object-contain opacity-60 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            sizes="220px"
          />
        )}

        {/* Bottom gradient overlay for name */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6">
          <p className="truncate text-center text-sm font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {name}
          </p>
        </div>

        {/* Level badge — top-right */}
        {level !== undefined && (
          <div className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500/80 bg-slate-900/90 text-base font-bold text-amber-400 shadow-lg">
            {level}
          </div>
        )}

        {/* Rating badge — top-left */}
        {rating !== undefined && (
          <RatingBadge rating={rating} />
        )}

        {/* Class icon badge — top-left (only when no rating) */}
        {rating === undefined && classKey && (
          <div className="absolute left-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-500/80 bg-slate-900/90 text-lg shadow-lg">
            {classIcon}
          </div>
        )}
      </div>

      {/* ═══ Ornamental divider ═══ */}
      <div className="relative flex h-3 items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${frame.accent} opacity-60`} />
        <div className="relative z-10 h-0.5 w-16 rounded-full bg-amber-500/60" />
      </div>

      {/* ═══ HP bar ═══ */}
      {hp && (
        <div className="px-2.5 pt-2">
          <HpBar current={hp.current} max={hp.max} />
        </div>
      )}

      {/* ═══ Description ═══ */}
      {description && (
        <div className="px-3 pt-2">
          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            {description}
          </p>
        </div>
      )}

      {/* ═══ Stat circles ═══ */}
      {visibleStats.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-3">
          {visibleStats.map((s) => (
            <StatCircle
              key={s.key}
              value={(stats as Record<string, number>)[s.key]}
              icon={s.icon}
              color={s.color}
              label={s.label}
              size={statSize}
            />
          ))}
        </div>
      )}

      {/* ═══ Children (buttons, extra content) ═══ */}
      {children}


      {/* ═══ Bottom ornament strip ═══ */}
      <div className={`h-1 w-full bg-gradient-to-r ${frame.accent} opacity-60`} />
    </Wrapper>
  );
});

HeroCard.displayName = "HeroCard";

export default HeroCard;
