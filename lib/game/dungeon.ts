/** Dungeon boss progression logic.
 *  Each dungeon has 10 fixed bosses beaten sequentially.
 *  GDD §5.5 enemy scaling: Boss_Stats = base × statMultiplier */

import {
  DUNGEONS,
  getDungeonById,
  type DungeonDefinition,
  type DungeonBoss,
} from "./dungeon-data";
import {
  BOSSES_PER_DUNGEON,
  BOSS_STAT_BASE_CONST,
  BOSS_STAT_LEVEL_MULT,
  BOSS_STAT_MIN,
  BOSS_STAT_FACTORS,
  BOSS_ARMOR_FACTOR,
  HP_PER_VIT,
  DUNGEON_GOLD_BASE,
  DUNGEON_GOLD_PER_DUNGEON,
  DUNGEON_GOLD_BOSS_SCALE,
  DUNGEON_XP_BASE,
  DUNGEON_XP_PER_DUNGEON,
  DUNGEON_XP_BOSS_SCALE,
  DUNGEON_COMPLETION_GOLD_BASE,
  DUNGEON_COMPLETION_GOLD_PER_DUNGEON,
  DUNGEON_COMPLETION_XP_BASE,
  DUNGEON_COMPLETION_XP_PER_DUNGEON,
} from "./balance";

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
  const base = Math.max(BOSS_STAT_MIN, Math.floor(BOSS_STAT_BASE_CONST + playerLevel * BOSS_STAT_LEVEL_MULT));
  const mult = boss.statMultiplier;

  const str = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.strength));
  const vit = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.vitality));
  const end = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.endurance));
  const agi = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.agility));
  const int = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.intelligence));
  const wis = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.wisdom));
  const hp = Math.max(100, vit * HP_PER_VIT);
  const armor = Math.max(0, Math.floor(end * BOSS_ARMOR_FACTOR));

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

/** Check if a dungeon is unlocked for this character given their progress records.
 *  Unlock condition: previous dungeon must be completed (minLevel is advisory only). */
export const isDungeonUnlocked = (
  dungeon: DungeonDefinition,
  _playerLevel: number,
  progressMap: Map<string, DungeonProgressRecord>,
): boolean => {
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
  const base = DUNGEON_GOLD_BASE + dungeonIndex * DUNGEON_GOLD_PER_DUNGEON;
  const bossScale = 1 + bossIndex * DUNGEON_GOLD_BOSS_SCALE;
  return Math.floor(base * bossScale);
};

/** XP reward per boss. */
export const getBossXpReward = (
  dungeonIndex: number,
  bossIndex: number,
): number => {
  const base = DUNGEON_XP_BASE + dungeonIndex * DUNGEON_XP_PER_DUNGEON;
  const bossScale = 1 + bossIndex * DUNGEON_XP_BOSS_SCALE;
  return Math.floor(base * bossScale);
};

/** Bonus reward for completing a full dungeon (10/10). */
export const getDungeonCompletionBonus = (
  dungeonIndex: number,
): { gold: number; xp: number } => ({
  gold: DUNGEON_COMPLETION_GOLD_BASE + dungeonIndex * DUNGEON_COMPLETION_GOLD_PER_DUNGEON,
  xp: DUNGEON_COMPLETION_XP_BASE + dungeonIndex * DUNGEON_COMPLETION_XP_PER_DUNGEON,
});

/* ─── Re-exports for convenience ─── */

export { DUNGEONS, getDungeonById, BOSSES_PER_DUNGEON };
export type { DungeonDefinition, DungeonBoss };
