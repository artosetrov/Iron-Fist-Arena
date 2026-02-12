/** Dungeon boss progression logic.
 *  Each dungeon has 10 fixed bosses beaten sequentially.
 *  GDD §5.5 enemy scaling: Boss_Stats = base × statMultiplier */

import {
  DUNGEONS,
  getDungeonById,
  BOSSES_PER_DUNGEON,
  type DungeonDefinition,
  type DungeonBoss,
} from "./dungeon-data";

/* ─── Boss stats ─── */

export type BossStats = {
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
  armor: number;
  maxHp: number;
  name: string;
};

/** Generate boss combat stats scaled to the player's level and the boss multiplier. */
export const getBossStats = (
  playerLevel: number,
  boss: DungeonBoss,
): BossStats => {
  const base = Math.max(10, Math.floor(30 + playerLevel * 4));
  const mult = boss.statMultiplier;

  const str = Math.max(10, Math.floor(base * mult * 0.9));
  const vit = Math.max(10, Math.floor(base * mult * 1.1));
  const end = Math.max(10, Math.floor(base * mult * 0.85));
  const agi = Math.max(10, Math.floor(base * mult * 0.7));
  const int = Math.max(10, Math.floor(base * mult * 0.6));
  const wis = Math.max(10, Math.floor(base * mult * 0.5));
  const hp = Math.max(100, vit * 10);
  const armor = Math.max(0, Math.floor(end * 0.8));

  return {
    strength: str,
    agility: agi,
    vitality: vit,
    endurance: end,
    intelligence: int,
    wisdom: wis,
    luck: 10,
    charisma: 10,
    armor,
    maxHp: hp,
    name: boss.name,
  };
};

/* ─── Dungeon unlock logic ─── */

export type DungeonProgressRecord = {
  dungeonId: string;
  bossIndex: number; // 0-9 (next boss to beat)
  completed: boolean;
};

/** Check if a dungeon is unlocked for this character given their progress records. */
export const isDungeonUnlocked = (
  dungeon: DungeonDefinition,
  playerLevel: number,
  progressMap: Map<string, DungeonProgressRecord>,
): boolean => {
  if (playerLevel < dungeon.minLevel) return false;
  if (!dungeon.prevDungeonId) return true;

  const prev = progressMap.get(dungeon.prevDungeonId);
  return !!prev?.completed;
};

/** Build the full dungeon list with unlock/progress state for a character. */
export const buildDungeonListWithProgress = (
  playerLevel: number,
  progressRecords: DungeonProgressRecord[],
) => {
  const progressMap = new Map<string, DungeonProgressRecord>();
  for (const r of progressRecords) {
    progressMap.set(r.dungeonId, r);
  }

  return DUNGEONS.map((dungeon) => {
    const unlocked = isDungeonUnlocked(dungeon, playerLevel, progressMap);
    const progress = progressMap.get(dungeon.id);
    const bossIndex = progress?.bossIndex ?? 0;
    const completed = progress?.completed ?? false;
    const currentBoss =
      completed || !unlocked ? null : dungeon.bosses[bossIndex] ?? null;

    return {
      ...dungeon,
      unlocked,
      bossIndex,
      completed,
      currentBoss,
    };
  });
};

/* ─── Reward formulas ─── */

/** Gold reward per boss. Scales with dungeon index and boss index. */
export const getBossGoldReward = (
  dungeonIndex: number,
  bossIndex: number,
): number => {
  const base = 20 + dungeonIndex * 30;
  const bossScale = 1 + bossIndex * 0.2;
  return Math.floor(base * bossScale);
};

/** XP reward per boss. */
export const getBossXpReward = (
  dungeonIndex: number,
  bossIndex: number,
): number => {
  const base = 30 + dungeonIndex * 25;
  const bossScale = 1 + bossIndex * 0.15;
  return Math.floor(base * bossScale);
};

/** Bonus reward for completing a full dungeon (10/10). */
export const getDungeonCompletionBonus = (
  dungeonIndex: number,
): { gold: number; xp: number } => ({
  gold: 200 + dungeonIndex * 150,
  xp: 300 + dungeonIndex * 200,
});

/* ─── Re-exports for convenience ─── */

export { DUNGEONS, getDungeonById, BOSSES_PER_DUNGEON };
export type { DungeonDefinition, DungeonBoss };
