"use client";

import { useState } from "react";
import GameIcon, { type GameIconKey } from "./GameIcon";

const TYPE_FALLBACK_ICON: Record<string, GameIconKey> = {
  physical: "fights",
  magic: "charisma",
  buff: "endurance",
};

type SkillIconProps = {
  abilityId: string;
  abilityType: string;
  size?: number;
  className?: string;
};

/** ability.id (e.g. boss_tail_swipe) → filename in /images/skills/ (without .png) */
const abilityIdToFilename = (abilityId: string): string =>
  abilityId.startsWith("boss_") ? abilityId.slice(5) : abilityId;

/**
 * Renders skill/ability icon: generated image from /images/skills/{filename}.png
 * with fallback to type-based GameIcon if image is missing.
 */
const SkillIcon = ({
  abilityId,
  abilityType,
  size = 40,
  className = "",
}: SkillIconProps) => {
  const [useFallback, setUseFallback] = useState(false);
  const fallbackKey = TYPE_FALLBACK_ICON[abilityType] ?? "dungeons";

  if (useFallback) {
    return <GameIcon name={fallbackKey} size={size} className={className} />;
  }

  const filename = abilityIdToFilename(abilityId);
  return (
    <img
      src={`/images/skills/${filename}.png`}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
      draggable={false}
      onError={() => setUseFallback(true)}
    />
  );
};

export default SkillIcon;
