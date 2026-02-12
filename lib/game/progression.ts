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

/** GDD §6.4 - Gold per match */
export const goldForPvPWin = (oppRating: number, winStreak: number): number => {
  let gold = PVP_WIN_BASE_GOLD + Math.floor(oppRating / 10);
  for (const [streak, bonus] of Object.entries(WIN_STREAK_BONUSES)) {
    if (winStreak >= Number(streak)) gold += bonus;
  }
  return gold;
};

export const goldForPvPLoss = (): number => PVP_LOSS_GOLD;
