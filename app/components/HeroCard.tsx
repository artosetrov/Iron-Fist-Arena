"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { getRankFromRating } from "@/lib/game/elo";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

/* ────────────────── Shared Constants ────────────────── */

export const CLASS_ICON: Record<string, GameIconKey> = {
  warrior: "warrior",
  rogue: "rogue",
  mage: "mage",
  tank: "tank",
};

export const CLASS_GRADIENT: Record<string, string> = {
  warrior: "from-red-900 to-red-950",
  rogue: "from-emerald-900 to-emerald-950",
  mage: "from-blue-900 to-blue-950",
  tank: "from-amber-900 to-amber-950",
};

export const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/origins/Avatar/origin-human_avatar_1.png",
  orc: "/images/origins/Avatar/origin-orc_avatar_1.png",
  skeleton: "/images/origins/Avatar/origin-skeleton_avatar_1.png",
  demon: "/images/origins/Avatar/origin-demon_avatar_1.png",
  dogfolk: "/images/origins/Avatar/origin-dogfolk_avatar_1.png",
};

export const BOSS_IMAGES: Record<string, string> = {
  "Straw Dummy": "/images/bosses/boss-straw-dummy.png",
  "Rusty Automaton": "/images/bosses/boss-rusty-automaton.png",
  "Barrel Golem": "/images/bosses/boss-barrel-golem.png",
  "Plank Knight": "/images/bosses/boss-plank-knight.png",
  "Flying Francis": "/images/bosses/boss-flying-francis.png",
  "Scarecrow Mage": "/images/bosses/boss-scarecrow-mage.png",
  "Mud Troll": "/images/bosses/boss-mud-troll.png",
  "Possessed Mannequin": "/images/bosses/boss-possessed-mannequin.png",
  "Iron Dummy": "/images/bosses/boss-iron-dummy.png",
  "Drill Sergeant Grizzle": "/images/bosses/boss-drill-sergeant-grizzle.png",
};

/* ────────────────── Card Frame Colors (CSS var driven) ────────────────── */

type FrameStyle = {
  borderColor: string;
  glowColor: string;
  accentFrom: string;
  accentVia: string;
  accentTo: string;
  gradientFrom: string;
  gradientTo: string;
};

const CLASS_FRAME_VARS: Record<string, FrameStyle> = {
  warrior: {
    borderColor: "var(--ds-class-warrior-border)",
    glowColor: "var(--ds-class-warrior-glow)",
    accentFrom: "var(--ds-class-warrior-accent-from)",
    accentVia: "var(--ds-class-warrior-accent-via)",
    accentTo: "var(--ds-class-warrior-accent-to)",
    gradientFrom: "var(--ds-class-warrior-gradient-from)",
    gradientTo: "var(--ds-class-warrior-gradient-to)",
  },
  rogue: {
    borderColor: "var(--ds-class-rogue-border)",
    glowColor: "var(--ds-class-rogue-glow)",
    accentFrom: "var(--ds-class-rogue-accent-from)",
    accentVia: "var(--ds-class-rogue-accent-via)",
    accentTo: "var(--ds-class-rogue-accent-to)",
    gradientFrom: "var(--ds-class-rogue-gradient-from)",
    gradientTo: "var(--ds-class-rogue-gradient-to)",
  },
  mage: {
    borderColor: "var(--ds-class-mage-border)",
    glowColor: "var(--ds-class-mage-glow)",
    accentFrom: "var(--ds-class-mage-accent-from)",
    accentVia: "var(--ds-class-mage-accent-via)",
    accentTo: "var(--ds-class-mage-accent-to)",
    gradientFrom: "var(--ds-class-mage-gradient-from)",
    gradientTo: "var(--ds-class-mage-gradient-to)",
  },
  tank: {
    borderColor: "var(--ds-class-tank-border)",
    glowColor: "var(--ds-class-tank-glow)",
    accentFrom: "var(--ds-class-tank-accent-from)",
    accentVia: "var(--ds-class-tank-accent-via)",
    accentTo: "var(--ds-class-tank-accent-to)",
    gradientFrom: "var(--ds-class-tank-gradient-from)",
    gradientTo: "var(--ds-class-tank-gradient-to)",
  },
};

const DEFAULT_FRAME_VARS: FrameStyle = {
  borderColor: "rgba(71,85,105,0.8)", // slate-600/80
  glowColor: "rgba(100,116,139,0.4)", // slate-600/40
  accentFrom: "#334155", // slate-700
  accentVia: "#1e293b", // slate-800
  accentTo: "#0f172a", // slate-900
  gradientFrom: "#1e293b",
  gradientTo: "#0f172a",
};

/* ────────────────── Stat Circle ────────────────── */

type StatCircleProps = {
  value: number;
  icon: GameIconKey;
  color: string;
  /** Hex color for the fill ring */
  fillColor: string;
  label: string;
  size?: "sm" | "md";
  hideLabel?: boolean;
  /** Max value for fill progress (default 100) */
  maxValue?: number;
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

const StatCircle = ({ value, fillColor, label, size = "md", hideLabel = false, maxValue = 100 }: StatCircleProps) => {
  const [hovered, setHovered] = useState(false);
  const dim = size === "sm" ? 36 : 44;
  const fontSize = size === "sm" ? "text-xs" : "text-sm";
  const abbr = STAT_ABBR[label] ?? label.slice(0, 3).toUpperCase();
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`flex items-center justify-center rounded-full font-display tabular-nums text-white shadow-md transition-transform hover:scale-110`}
        style={{
          width: dim,
          height: dim,
          background: `conic-gradient(${fillColor} ${pct}%, rgba(30,41,59,0.9) ${pct}%)`,
        }}
      >
        <span
          className={`flex items-center justify-center rounded-full bg-slate-900 ${fontSize}`}
          style={{ width: dim - 6, height: dim - 6 }}
        >
          {value}
        </span>
      </div>
      {!hideLabel && (
        <span className="mt-0.5 text-[8px] font-semibold uppercase leading-none tracking-wide text-slate-500">
          {abbr}
        </span>
      )}
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
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {clamped.toLocaleString()} / {max.toLocaleString()}
      </span>
    </div>
  );
};

/* ────────────────── Rating Badge ────────────────── */

const CLASS_BADGE_COLOR: Record<string, { border: string; text: string }> = {
  warrior: { border: "border-red-500/80", text: "text-red-400" },
  rogue: { border: "border-emerald-500/80", text: "text-emerald-400" },
  mage: { border: "border-blue-500/80", text: "text-blue-400" },
  tank: { border: "border-amber-500/80", text: "text-amber-400" },
};

const DEFAULT_BADGE_COLOR = { border: "border-slate-500/80", text: "text-slate-400" };

const RatingBadge = ({ rating, classKey }: { rating: number; classKey: string }) => {
  const [hovered, setHovered] = useState(false);
  const rank = getRankFromRating(rating);
  const badgeColor = CLASS_BADGE_COLOR[classKey] ?? DEFAULT_BADGE_COLOR;
  const classIconKey = CLASS_ICON[classKey];

  return (
    <div
      className="absolute left-2 top-2 z-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${badgeColor.border} bg-slate-900/90 shadow-lg`}>
        {classIconKey ? <GameIcon name={classIconKey} size={22} /> : "👤"}
      </div>
      {hovered && (
        <div className="pointer-events-none absolute -bottom-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-medium text-slate-300 shadow-lg">
          {rank} ({rating})
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
  /** Hide stat circles entirely (e.g. on small mobile cards) */
  hideStats?: boolean;
  /** Hide stat abbreviation labels below circles */
  hideStatLabels?: boolean;
  /** Max value for stat circle fill progress (default 100) */
  statMax?: number;
  /** Hide description text (e.g. on small mobile cards) */
  hideDescription?: boolean;
  /** Disable hover/click effects */
  disabled?: boolean;
  /** Aria label override */
  ariaLabel?: string;
  /** Replace aspect-ratio with h-full so parent grid/flex controls height (cards become equal-height) */
  fillHeight?: boolean;
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
  hideStats = false,
  hideStatLabels = false,
  statMax = 100,
  hideDescription = false,
  disabled = false,
  ariaLabel,
  fillHeight = false,
  children,
}: HeroCardProps) => {
  const classKey = cls?.toLowerCase() ?? "";
  const frame = CLASS_FRAME_VARS[classKey] ?? DEFAULT_FRAME_VARS;
  const classIconKey = CLASS_ICON[classKey];
  const customIcon = icon; // custom emoji string passed via prop

  // Determine which image to show
  const resolvedImage = imageSrc ?? BOSS_IMAGES[name] ?? (origin ? ORIGIN_IMAGE[origin] : undefined);
  const isBossImage = Boolean(imageSrc || BOSS_IMAGES[name]);
  const isOriginImage = !isBossImage && Boolean(origin && ORIGIN_IMAGE[origin]);

  // Battle animations
  const shakeClass = battle?.isShaking ? "animate-combat-shake" : "";
  const dodgeClass = battle?.isDodging ? "animate-dodge-slide" : "";

  // Selected / hover states
  const selectedClasses = selected
    ? "border-amber-500 ring-2 ring-amber-400/50 shadow-xl shadow-amber-600/30"
    : "hover:border-amber-600/50";

  // Stat config
  const statConfig = [
    { key: "strength", icon: "strength" as GameIconKey, color: "border-red-500", fillColor: "#ef4444", label: "Strength" },
    { key: "agility", icon: "agility" as GameIconKey, color: "border-emerald-500", fillColor: "#10b981", label: "Agility" },
    { key: "intelligence", icon: "intelligence" as GameIconKey, color: "border-blue-500", fillColor: "#3b82f6", label: "Intelligence" },
    { key: "vitality", icon: "vitality" as GameIconKey, color: "border-pink-500", fillColor: "#ec4899", label: "Vitality" },
    { key: "luck", icon: "luck" as GameIconKey, color: "border-amber-500", fillColor: "#f59e0b", label: "Luck" },
    { key: "endurance", icon: "endurance" as GameIconKey, color: "border-orange-500", fillColor: "#f97316", label: "Endurance" },
    { key: "wisdom", icon: "wisdom" as GameIconKey, color: "border-indigo-500", fillColor: "#6366f1", label: "Wisdom" },
    { key: "charisma", icon: "charisma" as GameIconKey, color: "border-purple-500", fillColor: "#a855f7", label: "Charisma" },
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
        group relative flex flex-col overflow-hidden border-2 transition-all duration-300
        ${fillHeight ? "h-full" : "aspect-[9/14]"}
        ${selectedClasses}
        ${shakeClass} ${dodgeClass}
        ${disabled ? "opacity-60 cursor-not-allowed" : onClick ? "cursor-pointer" : ""}
        bg-slate-950/90
      `}
      style={{
        borderRadius: "var(--ds-card-radius)",
        borderWidth: "var(--ds-card-border-width)",
        borderColor: selected ? undefined : frame.borderColor,
      }}
    >
      {/* ═══ Top ornament strip ═══ */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(to right, ${frame.accentFrom}, ${frame.accentVia}, ${frame.accentTo})` }}
      />

      {/* ═══ Portrait area ═══ */}
      <div
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${frame.gradientFrom}, ${frame.gradientTo})` }}
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
              className="relative z-10 h-full w-full object-cover drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              sizes="220px"
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
            src="/images/ui/placeholder-silhouette.png"
            alt={name}
            width={1024}
            height={1024}
            className="relative z-10 h-full w-full object-contain opacity-60 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            sizes="220px"
          />
        )}

        {/* Bottom gradient overlay for name */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6">
          <p className="truncate text-center font-display text-base text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {name}
          </p>
        </div>

        {/* Level badge — top-right */}
        {level !== undefined && (
          <div className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500/80 bg-slate-900/90 font-display text-lg font-black text-amber-400 shadow-lg">
            {level}
          </div>
        )}

        {/* Rating badge — top-left */}
        {rating !== undefined && (
          <RatingBadge rating={rating} classKey={classKey} />
        )}

        {/* Class icon badge — top-left (only when no rating) */}
        {rating === undefined && classKey && (
          <div className="absolute left-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-500/80 bg-slate-900/90 shadow-lg">
            {customIcon ? (
              <span className="text-lg">{customIcon}</span>
            ) : classIconKey ? (
              <GameIcon name={classIconKey} size={22} />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
        )}
      </div>

      {/* ═══ Ornamental divider ═══ */}
      <div className="relative flex h-3 items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: `linear-gradient(to right, ${frame.accentFrom}, ${frame.accentVia}, ${frame.accentTo})` }}
        />
        <div className="relative z-10 h-0.5 w-16 rounded-full bg-amber-500/60" />
      </div>

      {/* ═══ HP bar ═══ */}
      {hp && (
        <div className="px-2.5 py-2">
          <HpBar current={hp.current} max={hp.max} />
        </div>
      )}

      {/* ═══ Description ═══ */}
      {!hideDescription && description && (
        <div className="px-3 pt-2">
          <p className="line-clamp-2 min-h-[36px] text-center text-[11px] leading-relaxed text-slate-400">
            {description}
          </p>
        </div>
      )}

      {/* ═══ Stat circles ═══ */}
      {!hideStats && visibleStats.length > 0 && (
        <div className="hero-card-stats flex flex-wrap items-center justify-center gap-2 px-2 py-3">
          {visibleStats.map((s) => (
            <StatCircle
              key={s.key}
              value={(stats as Record<string, number>)[s.key]}
              icon={s.icon}
              color={s.color}
              fillColor={s.fillColor}
              label={s.label}
              size={statSize}
              hideLabel={hideStatLabels}
              maxValue={statMax}
            />
          ))}
        </div>
      )}

      {/* ═══ Children (buttons, extra content) ═══ */}
      {children}


      {/* ═══ Bottom ornament strip ═══ */}
      <div
        className="h-1 w-full opacity-60"
        style={{ background: `linear-gradient(to right, ${frame.accentFrom}, ${frame.accentVia}, ${frame.accentTo})` }}
      />
    </Wrapper>
  );
});

HeroCard.displayName = "HeroCard";

export default HeroCard;
