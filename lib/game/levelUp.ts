import { xpForLevel } from "./progression";

/** GDD §3 - Level up: +5 stat points, +1 skill every 5 levels, 100*level gold, full HP restore */
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
    statPointsGained += 5;
    if (level % 5 === 0) skillPointsGained += 1;
    goldGained += 100 * level;
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
