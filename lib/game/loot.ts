/** GDD §5.3 - Drop by rarity, Luck, difficulty bonus */

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ItemType =
  | "weapon"
  | "helmet"
  | "chest"
  | "gloves"
  | "legs"
  | "boots"
  | "accessory";

const RARITY_THRESHOLDS: { rarity: Rarity; minRoll: number }[] = [
  { rarity: "legendary", minRoll: 990 },
  { rarity: "epic", minRoll: 960 },
  { rarity: "rare", minRoll: 900 },
  { rarity: "uncommon", minRoll: 750 },
  { rarity: "common", minRoll: 0 },
];

const DIFFICULTY_BONUS: Record<string, number> = {
  easy: 0,
  normal: 50,
  hard: 120,
};

/** GDD §5.3 — Primary stat ranges per rarity */
const STAT_RANGE: Record<Rarity, [number, number]> = {
  common: [5, 15],
  uncommon: [12, 25],
  rare: [20, 45],
  epic: [40, 80],
  legendary: [75, 150],
};

/** GDD §5.3 — Secondary stat ranges per rarity */
const SECONDARY_STAT_RANGE: Record<Rarity, [number, number]> = {
  common: [0, 0],
  uncommon: [3, 10],
  rare: [5, 15],
  epic: [10, 25],
  legendary: [20, 50],
};

/** GDD §5.3 — How many secondary stats each rarity gets */
const SECONDARY_STAT_COUNT: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/** Armor ranges per slot per rarity (GDD balance) */
const ARMOR_SLOTS = new Set<ItemType>(["helmet", "chest", "gloves", "legs", "boots"]);

const ARMOR_RANGE: Record<string, Record<Rarity, [number, number]>> = {
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
};

/** Item type → primary stat, pool of secondary stats, name prefixes */
const ITEM_TYPE_CONFIG: Record<
  ItemType,
  { primaryStat: string; secondaryStats: string[]; namePrefixes: string[] }
> = {
  weapon: {
    primaryStat: "strength",
    secondaryStats: ["agility", "luck", "intelligence"],
    namePrefixes: ["Blade", "Sword", "Axe", "Mace", "Staff"],
  },
  helmet: {
    primaryStat: "wisdom",
    secondaryStats: ["vitality", "endurance", "intelligence"],
    namePrefixes: ["Helm", "Crown", "Hood", "Circlet"],
  },
  chest: {
    primaryStat: "endurance",
    secondaryStats: ["vitality", "strength", "wisdom"],
    namePrefixes: ["Chestplate", "Robe", "Hauberk", "Vest"],
  },
  gloves: {
    primaryStat: "agility",
    secondaryStats: ["strength", "luck", "endurance"],
    namePrefixes: ["Gauntlets", "Gloves", "Bracers", "Wraps"],
  },
  legs: {
    primaryStat: "vitality",
    secondaryStats: ["endurance", "agility", "strength"],
    namePrefixes: ["Greaves", "Leggings", "Tassets", "Pants"],
  },
  boots: {
    primaryStat: "agility",
    secondaryStats: ["vitality", "luck", "endurance"],
    namePrefixes: ["Boots", "Sabatons", "Treads", "Sandals"],
  },
  accessory: {
    primaryStat: "luck",
    secondaryStats: ["charisma", "intelligence", "wisdom", "agility"],
    namePrefixes: ["Amulet", "Ring", "Talisman", "Charm"],
  },
};

const ALL_ITEM_TYPES: ItemType[] = [
  "weapon",
  "helmet",
  "chest",
  "gloves",
  "legs",
  "boots",
  "accessory",
];

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

/** Enhanced_Roll = Drop_Roll + (Player_Luck × 2) + Difficulty_Bonus. Roll 1-1000. */
export const rollRarity = (luck: number, difficulty: string): Rarity => {
  const roll = Math.floor(Math.random() * 1000) + 1;
  const bonus = luck * 2 + (DIFFICULTY_BONUS[difficulty] ?? 0);
  const enhanced = Math.min(1200, roll + bonus);
  for (const { rarity, minRoll } of RARITY_THRESHOLDS) {
    if (enhanced >= minRoll) return rarity;
  }
  return "common";
};

/** Whether an item drops (e.g. 60% easy, 50% normal, 70% hard per enemy; boss guaranteed) */
export const rollDropChance = (
  difficulty: string,
  isBoss: boolean
): boolean => {
  if (isBoss) return true;
  const chance =
    difficulty === "easy" ? 0.6 : difficulty === "hard" ? 0.7 : 0.5;
  return Math.random() < chance;
};

/** Roll a random item type from all 7 equipment slots */
export const rollItemType = (): ItemType =>
  ALL_ITEM_TYPES[Math.floor(Math.random() * ALL_ITEM_TYPES.length)];

/** Generate baseStats object based on item type and rarity (GDD §5.3) */
export const generateItemStats = (
  itemType: ItemType,
  rarity: Rarity
): Record<string, number> => {
  const config = ITEM_TYPE_CONFIG[itemType];
  const [pLo, pHi] = STAT_RANGE[rarity];
  const primary = Math.floor(pLo + Math.random() * (pHi - pLo + 1));

  const stats: Record<string, number> = { [config.primaryStat]: primary };

  const secondaryCount = SECONDARY_STAT_COUNT[rarity];
  if (secondaryCount > 0) {
    const [sLo, sHi] = SECONDARY_STAT_RANGE[rarity];
    const pool = [...config.secondaryStats];
    const count = Math.min(secondaryCount, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const stat = pool.splice(idx, 1)[0];
      stats[stat] = Math.floor(sLo + Math.random() * (sHi - sLo + 1));
    }
  }

  // Add armor for armor-type slots
  if (ARMOR_SLOTS.has(itemType)) {
    const armorRange = ARMOR_RANGE[itemType]?.[rarity];
    if (armorRange) {
      const [aLo, aHi] = armorRange;
      stats.armor = Math.floor(aLo + Math.random() * (aHi - aLo + 1));
    }
  }

  return stats;
};

/** Generate a flavourful item name: "{Prefix} of {DungeonName}" */
export const generateItemName = (
  itemType: ItemType,
  rarity: Rarity,
  dungeonName: string
): string => {
  const { namePrefixes } = ITEM_TYPE_CONFIG[itemType];
  const prefix =
    namePrefixes[Math.floor(Math.random() * namePrefixes.length)];

  const rarityTitles: Record<Rarity, string> = {
    common: "",
    uncommon: "Fine ",
    rare: "Superior ",
    epic: "Mythic ",
    legendary: "Legendary ",
  };

  return `${rarityTitles[rarity]}${prefix} of ${dungeonName}`.trim();
};
