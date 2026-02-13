/**
 * ═══════════════════════════════════════════════════════════════════
 *  Iron Fist Arena — Centralised Game Balance & Constants
 *  All numbers taken directly from docs/iron_fist_arena_gdd.md
 *  This file exports ONLY constants and types — NO logic / functions.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Rarity type used across loot & economy systems */
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/* ──────────────────────────────────────────────────────────────────────
   §2  COMBAT
   ────────────────────────────────────────────────────────────────────── */

/** GDD §2.1 — Critical hit */
export const BASE_CRIT_CHANCE = 5;
export const MAX_CRIT_CHANCE = 50;
export const BASE_CRIT_DAMAGE = 1.5;
export const MAX_CRIT_DAMAGE_MULT = 2.8;

/** GDD §2.1 — Dodge */
export const BASE_DODGE = 3;
export const MAX_DODGE = 40;

/** GDD §2.1 — Armor & magic resist */
export const ARMOR_REDUCTION_CAP = 0.75;
export const ARMOR_DENOMINATOR = 100;
export const MAGIC_RESIST_CAP = 0.7;
export const MAGIC_RESIST_DENOM = 150;

/** GDD §2.1 — HP */
export const HP_PER_VIT = 10;

/** GDD §2.1 — Defence factors in damage formula */
export const END_DEFENSE_FACTOR = 0.5;
export const WIS_DEFENSE_FACTOR = 0.4;

/** GDD §2.1 — Random variance */
export const DAMAGE_VARIANCE_MIN = 0.95;
export const DAMAGE_VARIANCE_MAX = 1.05;

/** GDD §2 — Turn limit */
export const MAX_TURNS = 15;

/** Hard cap for any single stat */
export const MAX_STAT_VALUE = 999;

/** GDD §2.3 — Status effect damage (% of maxHP per turn) */
export const STATUS_EFFECT_PCT = {
  bleed: 0.05,
  poison: 0.03,
  burn: 0.04,
  regen: 0.05,
} as const;

/** GDD §2.3 — Armor break reduces armor by this multiplier (= -40%) */
export const ARMOR_BREAK_MULT = 0.6;

/** GDD §2.3 — Resist chance cap */
export const RESIST_CHANCE_CAP = 60;

/** Enemy (boss) AI: probability of using a skill when available */
export const ENEMY_SKILL_USE_CHANCE = 0.6;

/** Base spell multiplier used for magic damage preview */
export const BASE_SPELL_MULT = 1.2;

/* ──────────────────────────────────────────────────────────────────────
   §3  PROGRESSION
   ────────────────────────────────────────────────────────────────────── */

/** GDD §3.1 — XP formula: 100 * N^1.8 + 50 * N */
export const XP_BASE_MULT = 100;
export const XP_EXP = 1.8;
export const XP_LINEAR = 50;

/** GDD §3.1 — XP rewards per activity */
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

/** GDD §3.1 — XP scaling by enemy level divisor */
export const XP_ENEMY_LEVEL_DIVISOR = 50;

/** GDD §3.2 — Per-level gains */
export const STAT_POINTS_PER_LEVEL = 5;
export const SKILL_POINT_INTERVAL = 5;
export const GOLD_PER_LEVEL_MULT = 100;

/** GDD §2.1 — Stat soft caps */
export const STAT_SOFT_CAP = {
  strength: 300,
  agility: 250,
  vitality: 400,
  endurance: 300,
  intelligence: 300,
  wisdom: 250,
  luck: 200,
  charisma: 150,
} as const;

export type StatKey = keyof typeof STAT_SOFT_CAP;
export const STAT_HARD_CAP = 999;

/* ──────────────────────────────────────────────────────────────────────
   §4  STAMINA
   ────────────────────────────────────────────────────────────────────── */

/** GDD §4 — Regen: 1 per 12 min, max 100, VIP +20, overflow 200 */
export const STAMINA_REGEN_MINUTES = 12;
export const MAX_STAMINA_BASE = 100;
export const MAX_STAMINA_VIP_BONUS = 20;
export const OVERFLOW_CAP = 200;

/** GDD §4 — Costs per activity */
export const STAMINA_COST = {
  PVP: 10,
  DUNGEON_EASY: 15,
  DUNGEON_NORMAL: 20,
  DUNGEON_HARD: 25,
  BOSS_RAID: 40,
  SPECIAL_EVENT: 30,
  DUNGEON_RUSH: 3,
} as const;

export type StaminaActivity = keyof typeof STAMINA_COST;

/** GDD §4 — Gem-based refills */
export const STAMINA_REFILL = {
  small: { gems: 50, stamina: 25 },
  medium: { gems: 90, stamina: 50 },
  large: { gems: 150, stamina: 100 },
} as const;

export type StaminaRefillSize = keyof typeof STAMINA_REFILL;

/* ──────────────────────────────────────────────────────────────────────
   §6  PVP / ELO
   ────────────────────────────────────────────────────────────────────── */

/** GDD §6.3 — Rank tiers */
export type RankTierDef = {
  name: string;
  floor: number;
  ceiling: number; // exclusive
  divisions: boolean;
};

/** GDD §6.2 — ELO */
export const ELO_K = 32;
export const RATING_FLOOR = 0;
export const LOSS_STREAK_THRESHOLD = 3;
export const LOSS_STREAK_REDUCTION = 0.5;

/** GDD §6.2 — Matchmaking */
export const PVP_OPPONENTS_RATING_RANGE = 150;
export const PVP_MATCHMAKING_RATING_RANGE = 100;

/** GDD §6.3 — Rank tiers */
export const RANK_TIERS: RankTierDef[] = [
  { name: "Grandmaster", floor: 2100, ceiling: 99999, divisions: false },
  { name: "Master", floor: 1900, ceiling: 2100, divisions: false },
  { name: "Diamond", floor: 1700, ceiling: 1900, divisions: true },
  { name: "Platinum", floor: 1500, ceiling: 1700, divisions: true },
  { name: "Gold", floor: 1300, ceiling: 1500, divisions: true },
  { name: "Silver", floor: 1100, ceiling: 1300, divisions: true },
  { name: "Bronze", floor: 0, ceiling: 1100, divisions: true },
];

/** GDD §6.4 — PvP gold rewards */
export const PVP_WIN_BASE_GOLD = 100;
export const PVP_LOSS_GOLD = 30;
export const WIN_STREAK_BONUSES: Record<number, number> = {
  2: 50,
  3: 100,
  4: 200,
  5: 400,
};

/** GDD §5 — Dungeon rating rewards */
export const BOSS_KILL_RATING_BASE = 5;
export const BOSS_KILL_RATING_PER_LEVEL = 2;
export const DUNGEON_COMPLETE_RATING_BASE = 10;
export const DUNGEON_COMPLETE_RATING_PER_LEVEL = 0.5;

/* ──────────────────────────────────────────────────────────────────────
   §5.3  LOOT
   ────────────────────────────────────────────────────────────────────── */

/** GDD §5.3 — Enhanced roll thresholds */
export const RARITY_THRESHOLDS: { rarity: Rarity; minRoll: number }[] = [
  { rarity: "legendary", minRoll: 990 },
  { rarity: "epic", minRoll: 960 },
  { rarity: "rare", minRoll: 900 },
  { rarity: "uncommon", minRoll: 750 },
  { rarity: "common", minRoll: 0 },
];
export const DIFFICULTY_BONUS: Record<string, number> = {
  easy: 0,
  normal: 50,
  hard: 120,
};
export const MAX_ENHANCED_ROLL = 1200;

/** GDD §5.3 — Drop chance per difficulty (boss always 100%) */
export const DROP_CHANCE: Record<string, number> = {
  easy: 0.6,
  normal: 0.5,
  hard: 0.7,
};

/** GDD §5.3 — Primary stat ranges per rarity */
export const STAT_RANGE: Record<Rarity, [number, number]> = {
  common: [5, 15],
  uncommon: [12, 25],
  rare: [20, 45],
  epic: [40, 80],
  legendary: [75, 150],
};

/** GDD §5.3 — Secondary stat ranges per rarity */
export const SECONDARY_STAT_RANGE: Record<Rarity, [number, number]> = {
  common: [0, 0],
  uncommon: [3, 10],
  rare: [5, 15],
  epic: [10, 25],
  legendary: [20, 50],
};

/** GDD §5.3 — How many secondary stats each rarity gets */
export const SECONDARY_STAT_COUNT: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/** Armor ranges per slot per rarity */
export const ARMOR_RANGE: Record<string, Record<Rarity, [number, number]>> = {
  helmet: {
    common: [21, 29],
    uncommon: [30, 40],
    rare: [42, 55],
    epic: [60, 78],
    legendary: [55, 95],
  },
  chest: {
    common: [38, 52],
    uncommon: [55, 72],
    rare: [78, 96],
    epic: [110, 135],
    legendary: [100, 165],
  },
  gloves: {
    common: [13, 17],
    uncommon: [18, 24],
    rare: [25, 32],
    epic: [36, 44],
    legendary: [30, 60],
  },
  legs: {
    common: [15, 20],
    uncommon: [21, 28],
    rare: [27, 35],
    epic: [38, 48],
    legendary: [35, 65],
  },
  boots: {
    common: [13, 17],
    uncommon: [18, 24],
    rare: [25, 32],
    epic: [36, 44],
    legendary: [35, 60],
  },
  belt: {
    common: [5, 10],
    uncommon: [11, 16],
    rare: [17, 24],
    epic: [25, 35],
    legendary: [30, 55],
  },
};

/* ──────────────────────────────────────────────────────────────────────
   §7  ECONOMY
   ────────────────────────────────────────────────────────────────────── */

/** Starting character resources */
export const STARTING_GOLD = 100;
export const STARTING_STAMINA = 100;
export const STARTING_MAX_STAMINA = 100;

/** GDD §7.4 — Repair: cost = basePrice * REPAIR_COST_PCT * (lost / maxDur) */
export const REPAIR_COST_PCT = 0.1;
export const REPAIR_FALLBACK_PRICE = 100;

/** GDD §7.5 — Upgrade system */
export const UPGRADE_MAX_LEVEL = 10;
export const UPGRADE_BASE_CHANCE = 75;
export const UPGRADE_CHANCE_PER_LEVEL = 5;
export const UPGRADE_COST_MULT = 0.2;
export const UPGRADE_COST_EXP = 1.5;
export const UPGRADE_FALLBACK_PRICE = 100;

/** On failure: cumulative thresholds (0-50: stay, 50-80: downgrade, 80-100: destroy) */
export const UPGRADE_FAIL_STAY = 50;
export const UPGRADE_FAIL_DOWNGRADE = 80; // failRoll < 80 → downgrade
// failRoll >= 80 → destroy (20% chance)

/** GDD §7.2 — Sell price rarity multipliers */
export const SELL_RARITY_MULT: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 10,
  legendary: 25,
};
export const SELL_BASE_MULT = 10;
export const SELL_STAT_MULT = 5;

/** GDD §7 — Buy price rarity multipliers (same as sell) */
export const BUY_RARITY_PRICE_MULT: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 10,
  legendary: 25,
};
export const BUY_BASE_MULT = 10;

/** GDD §7.6 — Stat training: cost = floor(BASE * GROWTH^statValue) */
export const STAT_TRAIN_BASE = 50;
export const STAT_TRAIN_GROWTH = 1.05;

/** Inventory limit */
export const INVENTORY_LIMIT = 50;

/** GDD §7.1 — Gold packages (IAP) */
export const GOLD_PACKAGES = {
  gold_1000: { gold: 1000, priceUsd: 0.99, label: "1,000 Gold" },
  gold_5000: { gold: 5000, priceUsd: 3.99, label: "5,000 Gold" },
  gold_10000: { gold: 10000, priceUsd: 6.99, label: "10,000 Gold" },
} as const;

export type GoldPackageId = keyof typeof GOLD_PACKAGES;

/** GDD — Origin change cost */
export const ORIGIN_CHANGE_COST = 500;

/* ──────────────────────────────────────────────────────────────────────
   §5  DUNGEON
   ────────────────────────────────────────────────────────────────────── */

/** Bosses per dungeon */
export const BOSSES_PER_DUNGEON = 10;

/** Boss stat generation: base = max(10, floor(30 + playerLevel * 4)) */
export const BOSS_STAT_BASE_CONST = 30;
export const BOSS_STAT_LEVEL_MULT = 4;
export const BOSS_STAT_MIN = 10;

/** Per-stat multipliers for boss generation */
export const BOSS_STAT_FACTORS = {
  strength: 0.9,
  vitality: 1.1,
  endurance: 0.85,
  agility: 0.7,
  intelligence: 0.6,
  wisdom: 0.5,
} as const;

/** Boss armor = floor(END * 0.8) */
export const BOSS_ARMOR_FACTOR = 0.8;

/** Boss index scaling: mult + index * 0.15 */
export const BOSS_INDEX_SCALING = 0.15;

/** Dungeon gold reward: base + dungeonIndex * perDungeon */
export const DUNGEON_GOLD_BASE = 20;
export const DUNGEON_GOLD_PER_DUNGEON = 30;
export const DUNGEON_GOLD_BOSS_SCALE = 0.2;

/** Dungeon XP reward */
export const DUNGEON_XP_BASE = 30;
export const DUNGEON_XP_PER_DUNGEON = 25;
export const DUNGEON_XP_BOSS_SCALE = 0.15;

/** Dungeon completion bonus */
export const DUNGEON_COMPLETION_GOLD_BASE = 200;
export const DUNGEON_COMPLETION_GOLD_PER_DUNGEON = 150;
export const DUNGEON_COMPLETION_XP_BASE = 300;
export const DUNGEON_COMPLETION_XP_PER_DUNGEON = 200;

/** Item level variance when dropping from dungeon: level + random(-2 to +3) */
export const ITEM_LEVEL_VARIANCE_MIN = -2;
export const ITEM_LEVEL_VARIANCE_MAX = 3;
export const ITEM_LEVEL_VARIANCE_RANGE = 6; // random(0..5) + MIN

/* ──────────────────────────────────────────────────────────────────────
   QUESTS
   ────────────────────────────────────────────────────────────────────── */

export const QUEST_POOL = [
  { questType: "pvp_wins", target: 3, rewardGold: 200, rewardXp: 200, rewardGems: 20 },
  { questType: "dungeons_complete", target: 2, rewardGold: 300, rewardXp: 300, rewardGems: 25 },
  { questType: "pvp_wins", target: 5, rewardGold: 500, rewardXp: 400, rewardGems: 50 },
  { questType: "dungeons_complete", target: 1, rewardGold: 150, rewardXp: 150, rewardGems: 15 },
] as const;

export const DAILY_QUEST_COUNT = 3;

/* ──────────────────────────────────────────────────────────────────────
   TRAINING (Combat Simulate / Training Dummy)
   ────────────────────────────────────────────────────────────────────── */

/** Max training fights per day */
export const TRAINING_MAX_DAILY = 10;

/** XP formula: TRAINING_XP_BASE + level * TRAINING_XP_PER_LEVEL */
export const TRAINING_XP_BASE = 20;
export const TRAINING_XP_PER_LEVEL = 5;

/** Dummy level = player level - TRAINING_DUMMY_LEVEL_OFFSET (min 1) */
export const TRAINING_DUMMY_LEVEL_OFFSET = 2;

/** Dummy stats = player stats * TRAINING_DUMMY_STAT_MULT */
export const TRAINING_DUMMY_STAT_MULT = 0.6;

/* ──────────────────────────────────────────────────────────────────────
   DUNGEON RUSH (Mini-game)
   ────────────────────────────────────────────────────────────────────── */

/** Number of waves in a Dungeon Rush run */
export const RUSH_WAVES = 5;

/** XP per wave (multiplied by wave number) */
export const RUSH_XP_PER_WAVE = 15;

/** Gold per wave (multiplied by wave number) */
export const RUSH_GOLD_PER_WAVE = 10;

/** Bonus gold for clearing all waves */
export const RUSH_FULL_CLEAR_BONUS = 100;

/** Mob stat multiplier relative to boss stats */
export const RUSH_MOB_STAT_MULT = 0.55;

/* ──────────────────────────────────────────────────────────────────────
   GOLD MINE (Idle Mini-game)
   ────────────────────────────────────────────────────────────────────── */

/** Mining session duration (non-VIP) in milliseconds — 4 hours */
export const GOLD_MINE_DURATION_MS = 4 * 60 * 60 * 1000;

/** Mining session duration (VIP) in milliseconds — 2 hours */
export const GOLD_MINE_VIP_DURATION_MS = 2 * 60 * 60 * 1000;

/** Base gold reward per mining session */
export const GOLD_MINE_BASE_REWARD = 50;

/** Gold reward multiplier per character level */
export const GOLD_MINE_LEVEL_MULT = 5;

/** Free mining slots available to all players */
export const GOLD_MINE_FREE_SLOTS = 1;

/** Maximum mining slots (free + purchased) */
export const GOLD_MINE_MAX_SLOTS = 5;

/** Gem cost to buy an additional mining slot */
export const GOLD_MINE_SLOT_COST_GEMS = 200;

/** Gem cost to boost (instant-finish) a mining session */
export const GOLD_MINE_BOOST_COST_GEMS = 50;
