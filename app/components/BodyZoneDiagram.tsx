"use client";

import { memo } from "react";
import type { BodyZone, CombatStance } from "@/lib/game/types";
import { GAME_ICON_MAP } from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

/* ── Zone layout (top-to-bottom SVG regions) ── */

type ZoneConfig = {
  zone: BodyZone;
  label: string;
  shortLabel: string;
  y: number;
  height: number;
  icon: GameIconKey;
};

const ZONES: ZoneConfig[] = [
  { zone: "head", label: "Head", shortLabel: "H", y: 0, height: 48, icon: "helmet" },
  { zone: "torso", label: "Torso", shortLabel: "T", y: 52, height: 68, icon: "chest" },
  { zone: "waist", label: "Waist", shortLabel: "W", y: 124, height: 44, icon: "belt" },
  { zone: "legs", label: "Legs", shortLabel: "L", y: 172, height: 68, icon: "legs" },
];

const SVG_WIDTH = 120;
const SVG_HEIGHT = 240;
const ZONE_INSET = 10;
const ZONE_WIDTH = SVG_WIDTH - ZONE_INSET * 2;

/* ── Colors ── */

const getZoneColor = (
  zone: BodyZone,
  stance: CombatStance | null,
  mode: "attack" | "block" | "both",
): string => {
  if (!stance) return "rgba(100, 116, 139, 0.25)"; // slate-500/25

  const isAttack = stance.attackZones.includes(zone);
  const blocks = stance.blockAllocation[zone] ?? 0;

  if (mode === "attack" && isAttack) return "rgba(239, 68, 68, 0.45)"; // red
  if (mode === "block" && blocks > 0) {
    const opacity = 0.2 + blocks * 0.18;
    return `rgba(59, 130, 246, ${opacity})`; // blue
  }
  if (mode === "both") {
    if (isAttack) return "rgba(239, 68, 68, 0.45)";
    if (blocks > 0) {
      const opacity = 0.2 + blocks * 0.18;
      return `rgba(59, 130, 246, ${opacity})`;
    }
  }
  return "rgba(100, 116, 139, 0.15)";
};

const getZoneBorder = (
  zone: BodyZone,
  stance: CombatStance | null,
  highlightZone?: BodyZone,
): string => {
  if (highlightZone === zone) return "rgba(251, 191, 36, 0.9)"; // amber flash
  if (!stance) return "rgba(100, 116, 139, 0.4)";
  const isAttack = stance.attackZones.includes(zone);
  const blocks = stance.blockAllocation[zone] ?? 0;
  if (isAttack) return "rgba(239, 68, 68, 0.7)";
  if (blocks > 0) return "rgba(59, 130, 246, 0.6)";
  return "rgba(100, 116, 139, 0.3)";
};

/* ── Props ── */

type BodyZoneDiagramProps = {
  /** Current stance to visualize */
  stance: CombatStance | null;
  /** Display mode: attack zones, block zones, or both */
  mode?: "attack" | "block" | "both";
  /** Clickable zone callback (for StanceSelector interactivity) */
  onZoneClick?: (zone: BodyZone) => void;
  /** Per-zone armor values to display */
  zoneArmor?: Record<BodyZone, number>;
  /** Highlighted zone (e.g. during combat hit animation) */
  highlightZone?: BodyZone;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class */
  className?: string;
};

const SIZE_MAP = {
  sm: { width: 80, scale: 80 / SVG_WIDTH },
  md: { width: 120, scale: 1 },
  lg: { width: 180, scale: 180 / SVG_WIDTH },
};

/* ── Block dots ── */

const BlockDots = ({ count, cx, cy }: { count: number; cx: number; cy: number }) => {
  if (count <= 0) return null;
  const dotR = 3;
  const gap = 10;
  const startX = cx - ((count - 1) * gap) / 2;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx={startX + i * gap}
          cy={cy}
          r={dotR}
          fill="rgba(96, 165, 250, 0.9)"
          stroke="rgba(30, 58, 138, 0.6)"
          strokeWidth={1}
        />
      ))}
    </>
  );
};

/* ── Component ── */

const BodyZoneDiagram = memo(({
  stance,
  mode = "both",
  onZoneClick,
  zoneArmor,
  highlightZone,
  size = "md",
  className = "",
}: BodyZoneDiagramProps) => {
  const { width } = SIZE_MAP[size];
  const interactive = !!onZoneClick;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width={width}
        height={Math.round((width / SVG_WIDTH) * SVG_HEIGHT)}
        className="select-none"
        role="img"
        aria-label="Body zone diagram"
      >
        {/* Background silhouette outline */}
        <rect
          x={ZONE_INSET - 2}
          y={0}
          width={ZONE_WIDTH + 4}
          height={SVG_HEIGHT}
          rx={12}
          fill="rgba(15, 23, 42, 0.6)"
          stroke="rgba(100, 116, 139, 0.2)"
          strokeWidth={1}
        />

        {ZONES.map((zc) => {
          const fillColor = getZoneColor(zc.zone, stance, mode);
          const borderColor = getZoneBorder(zc.zone, stance, highlightZone);
          const blocks = stance?.blockAllocation[zc.zone] ?? 0;
          const armor = zoneArmor?.[zc.zone];
          const isHighlight = highlightZone === zc.zone;

          return (
            <g key={zc.zone}>
              {/* Zone rect */}
              <rect
                x={ZONE_INSET}
                y={zc.y + 2}
                width={ZONE_WIDTH}
                height={zc.height - 4}
                rx={6}
                fill={fillColor}
                stroke={borderColor}
                strokeWidth={isHighlight ? 2.5 : 1.5}
                className={[
                  "transition-all duration-200",
                  interactive ? "cursor-pointer hover:brightness-125" : "",
                ].join(" ")}
                onClick={interactive ? () => onZoneClick(zc.zone) : undefined}
                tabIndex={interactive ? 0 : undefined}
                role={interactive ? "button" : undefined}
                aria-label={`${zc.label} zone`}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onZoneClick(zc.zone);
                        }
                      }
                    : undefined
                }
              />

              {/* Zone icon + label */}
              {(() => {
                const labelY = zc.y + zc.height / 2 - (blocks > 0 ? 5 : 0);
                const iconSrc = GAME_ICON_MAP[zc.icon];

                if (size === "sm") {
                  return (
                    <text
                      x={SVG_WIDTH / 2}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none select-none"
                      fill="rgba(226, 232, 240, 0.9)"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {zc.shortLabel}
                    </text>
                  );
                }

                const iconSize = size === "lg" ? 22 : 16;
                const gap = 3;
                const fontSize = size === "lg" ? 13 : 12;
                /* Approximate text width to center icon+text group */
                const textWidth = zc.label.length * fontSize * 0.58;
                const totalWidth = iconSize + gap + textWidth;
                const groupStartX = SVG_WIDTH / 2 - totalWidth / 2;

                return (
                  <>
                    <image
                      href={iconSrc}
                      x={groupStartX}
                      y={labelY - iconSize / 2}
                      width={iconSize}
                      height={iconSize}
                      className="pointer-events-none"
                      opacity={0.85}
                    />
                    <text
                      x={groupStartX + iconSize + gap}
                      y={labelY}
                      textAnchor="start"
                      dominantBaseline="central"
                      className="pointer-events-none select-none"
                      fill="rgba(226, 232, 240, 0.9)"
                      fontSize={fontSize}
                      fontWeight={600}
                    >
                      {zc.label}
                    </text>
                  </>
                );
              })()}

              {/* Armor badge */}
              {armor !== undefined && armor > 0 && size !== "sm" && (
                <text
                  x={SVG_WIDTH - ZONE_INSET - 6}
                  y={zc.y + 14}
                  textAnchor="end"
                  className="pointer-events-none select-none"
                  fill="rgba(148, 163, 184, 0.7)"
                  fontSize={9}
                >
                  🛡{armor}
                </text>
              )}

              {/* Block dots */}
              {blocks > 0 && (
                <BlockDots
                  count={blocks}
                  cx={SVG_WIDTH / 2}
                  cy={zc.y + zc.height / 2 + (size === "sm" ? 8 : 12)}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

BodyZoneDiagram.displayName = "BodyZoneDiagram";

export default BodyZoneDiagram;
export { ZONES };
