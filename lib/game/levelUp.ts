import { xpForLevel } from "./progression";
import {
  STAT_POINTS_PER_LEVEL,
  SKILL_POINT_INTERVAL,
  GOLD_PER_LEVEL_MULT,
} from "./balance";

/** GDD §3 — Level up: +5 stat points, +1 skill every 5 levels, gold, full HP. Early levels (2–5) get reduced gold for balance. */
const EARLY_LEVEL_CAP = 5;
const EARLY_LEVEL_GOLD_MULT = 50;

export const checkLevelUp = (params: {
  level: number;
  currentXp: number;
}): { newLevel: number; newCurrentXp: number; statPointsGained: number; skillPointsGained: number; goldGained: number } => {
  let { level, currentXp } = params;
  let statPointsGained = 0;
  let skillPointsGained = 0;
  let goldGained = 0;

  let xpNeeded = xpForLevel(level);
  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    level++;
    statPointsGained += STAT_POINTS_PER_LEVEL;
    if (level % SKILL_POINT_INTERVAL === 0) skillPointsGained += 1;
    const goldThisLevel =
      level <= EARLY_LEVEL_CAP
        ? EARLY_LEVEL_GOLD_MULT * level
        : GOLD_PER_LEVEL_MULT * level;
    goldGained += goldThisLevel;
    xpNeeded = xpForLevel(level);
  }

  return {
    newLevel: level,
    newCurrentXp: currentXp,
    statPointsGained,
    skillPointsGained,
    goldGained,
  };
};

/** Apply level-up to character: update level, currentXp, statPointsAvailable, gold, currentHp (full heal) */
export const applyLevelUp = (params: {
  level: number;
  currentXp: number;
  statPointsAvailable: number;
  gold: number;
  maxHp: number;
}): {
  level: number;
  currentXp: number;
  statPointsAvailable: number;
  gold: number;
  currentHp: number;
} => {
  const result = checkLevelUp({ level: params.level, currentXp: params.currentXp });
  return {
    level: result.newLevel,
    currentXp: result.newCurrentXp,
    statPointsAvailable: params.statPointsAvailable + result.statPointsGained,
    gold: params.gold + result.goldGained,
    currentHp: params.maxHp,
  };
};
