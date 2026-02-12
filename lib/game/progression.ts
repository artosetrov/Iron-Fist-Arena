/** GDD §3.1 - XP required for level N */
export const xpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.8) + 50 * level);
};

/** GDD §3.1 - Base XP sources */
export const XP_REWARD = {
  PVP_WIN: 100,
  PVP_LOSS: 30,
  EASY_DUNGEON_PER_FLOOR: 80,
  NORMAL_DUNGEON_PER_FLOOR: 150,
  HARD_DUNGEON_PER_FLOOR: 250,
  BOSS_KILL: 500,
  DAILY_QUEST: 200,
  WEEKLY_QUEST: 1000,
} as const;

/** Scale XP by enemy level: *(1 + Enemy_Level/50) */
export const scaleXpByLevel = (baseXp: number, enemyLevel: number): number => {
  return Math.floor(baseXp * (1 + enemyLevel / 50));
};

/** GDD §6.4 - Gold per match */
export const goldForPvPWin = (oppRating: number, winStreak: number): number => {
  let gold = 100 + Math.floor(oppRating / 10);
  if (winStreak >= 2) gold += 50;
  if (winStreak >= 3) gold += 100;
  if (winStreak >= 4) gold += 200;
  if (winStreak >= 5) gold += 400;
  return gold;
};

export const goldForPvPLoss = (): number => 30;
