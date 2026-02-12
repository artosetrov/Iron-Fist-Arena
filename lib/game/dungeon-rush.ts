/** Dungeon Rush — PvE mini-run (5 waves of auto-combat)
 *  Constants in balance.ts, combat via combat.ts */

import {
  RUSH_WAVES,
  RUSH_XP_PER_WAVE,
  RUSH_GOLD_PER_WAVE,
  RUSH_FULL_CLEAR_BONUS,
  RUSH_MOB_STAT_MULT,
  BOSS_STAT_BASE_CONST,
  BOSS_STAT_LEVEL_MULT,
  BOSS_STAT_MIN,
  BOSS_STAT_FACTORS,
  BOSS_ARMOR_FACTOR,
  HP_PER_VIT,
} from "./balance";

/* ─── Types ─── */

export type DungeonRushState = {
  runId: string;
  characterId: string;
  currentWave: number; // 1-based, next wave to fight
  totalWaves: number;
  accumulatedGold: number;
  accumulatedXp: number;
};

export type RushMobStats = {
  name: string;
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
};

/* ─── Mob name pool ─── */

const MOB_NAMES: string[] = [
  "Goblin Thug",
  "Cave Rat",
  "Orc Grunt",
  "Feral Wolf",
  "Skeleton Scout",
  "Mushroom Creep",
  "Bandit Rogue",
  "Plague Bat",
  "Swamp Toad",
  "Ember Imp",
  "Stone Golem Shard",
  "Shadow Wisp",
  "Crypt Spider",
  "Dust Wraith",
  "Iron Beetle",
  "Frost Sprite",
  "Lava Slime",
  "Rot Zombie",
  "Sand Scorpion",
  "Vine Creeper",
];

/* ─── Mob generation ─── */

/** Generate a rush mob scaled to player level and wave number.
 *  Mobs use RUSH_MOB_STAT_MULT (0.55) of dungeon boss base stats
 *  and scale up slightly per wave (1 + wave * 0.1). */
export const generateRushMob = (
  playerLevel: number,
  wave: number,
): RushMobStats => {
  const base = Math.max(
    BOSS_STAT_MIN,
    Math.floor(BOSS_STAT_BASE_CONST + playerLevel * BOSS_STAT_LEVEL_MULT),
  );
  const waveScale = 1 + wave * 0.1;
  const mult = RUSH_MOB_STAT_MULT * waveScale;

  const str = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.strength));
  const vit = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.vitality));
  const end = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.endurance));
  const agi = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.agility));
  const int = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.intelligence));
  const wis = Math.max(BOSS_STAT_MIN, Math.floor(base * mult * BOSS_STAT_FACTORS.wisdom));
  const hp = Math.max(100, vit * HP_PER_VIT);
  const armor = Math.max(0, Math.floor(end * BOSS_ARMOR_FACTOR));

  const name = MOB_NAMES[Math.floor(Math.random() * MOB_NAMES.length)];

  return {
    name,
    strength: str,
    agility: agi,
    vitality: vit,
    endurance: end,
    intelligence: int,
    wisdom: wis,
    luck: 5,
    charisma: 5,
    armor,
    maxHp: hp,
  };
};

/* ─── Reward formulas ─── */

/** XP and gold for a given wave (1-based). */
export const getRushWaveReward = (wave: number): { xp: number; gold: number } => ({
  xp: RUSH_XP_PER_WAVE * wave,
  gold: RUSH_GOLD_PER_WAVE * wave,
});

/** Bonus gold for clearing all 5 waves. */
export const getRushFullClearBonus = (): number => RUSH_FULL_CLEAR_BONUS;

/* ─── Re-exports ─── */

export { RUSH_WAVES };
