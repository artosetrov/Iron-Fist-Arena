/** GDD §3.1 - XP and progression (logic only — constants in balance.ts) */

import {
  XP_BASE_MULT,
  XP_EXP,
  XP_LINEAR,
  XP_REWARD,
  XP_ENEMY_LEVEL_DIVISOR,
  PVP_WIN_BASE_GOLD,
  PVP_LOSS_GOLD,
  WIN_STREAK_BONUSES,
} from "./balance";

// Re-export for convenience
export { XP_REWARD };

/** GDD §3.1 - XP required for level N */
export const xpForLevel = (level: number): number => {
  return Math.floor(XP_BASE_MULT * Math.pow(level, XP_EXP) + XP_LINEAR * level);
};

/** Scale XP by enemy level: *(1 + Enemy_Level/50) */
export const scaleXpByLevel = (baseXp: number, enemyLevel: number): number => {
  return Math.floor(baseXp * (1 + enemyLevel / XP_ENEMY_LEVEL_DIVISOR));
};

/** GDD §6.4 — Gold per win. Early-game (low opponent rating) gives less to avoid gold flood. */
export const PVP_LOW_RATING_THRESHOLD = 500;
export const PVP_LOW_RATING_BASE_GOLD = 50;

/** Gold per match (tiered streak bonus — only highest applicable) */
export const goldForPvPWin = (oppRating: number, winStreak: number): number => {
  const ratingPart = Math.floor(oppRating / 10);
  const base =
    oppRating < PVP_LOW_RATING_THRESHOLD
      ? PVP_LOW_RATING_BASE_GOLD + ratingPart
      : PVP_WIN_BASE_GOLD + ratingPart;

  let bestBonus = 0;
  for (const [streak, bonus] of Object.entries(WIN_STREAK_BONUSES)) {
    if (winStreak >= Number(streak) && bonus > bestBonus) {
      bestBonus = bonus;
    }
  }
  return base + bestBonus;
};

export const goldForPvPLoss = (): number => PVP_LOSS_GOLD;
