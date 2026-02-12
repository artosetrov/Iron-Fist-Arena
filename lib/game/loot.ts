/** GDD §5.3 - Drop by rarity, Luck, difficulty bonus */

import {
  RARITY_THRESHOLDS,
  DIFFICULTY_BONUS,
  MAX_ENHANCED_ROLL,
  DROP_CHANCE,
  STAT_RANGE,
  SECONDARY_STAT_RANGE,
  SECONDARY_STAT_COUNT,
  ARMOR_RANGE,
} from "./balance";
import type { Rarity } from "./balance";

// Re-export Rarity type for consumers that imported from here
export type { Rarity };

export type ItemType =
  | "weapon"
  | "helmet"
  | "chest"
  | "gloves"
  | "legs"
  | "boots"
  | "accessory"
  | "amulet"
  | "belt"
  | "relic";

/** Armor-type slots */
const ARMOR_SLOTS = new Set<ItemType>(["helmet", "chest", "gloves", "legs", "boots", "belt"]);

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
  amulet: {
    primaryStat: "wisdom",
    secondaryStats: ["vitality", "intelligence", "endurance"],
    namePrefixes: ["Pendant", "Amulet", "Necklace", "Torc"],
  },
  belt: {
    primaryStat: "endurance",
    secondaryStats: ["vitality", "strength", "agility"],
    namePrefixes: ["Belt", "Sash", "Girdle", "Cinch"],
  },
  relic: {
    primaryStat: "luck",
    secondaryStats: ["intelligence", "agility", "strength"],
    namePrefixes: ["Relic", "Orb", "Effigy", "Sigil"],
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
  "amulet",
  "belt",
  "relic",
];

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

/** Enhanced_Roll = Drop_Roll + (Player_Luck × 2) + Difficulty_Bonus. Roll 1-1000. */
export const rollRarity = (luck: number, difficulty: string): Rarity => {
  const roll = Math.floor(Math.random() * 1000) + 1;
  const bonus = luck * 2 + (DIFFICULTY_BONUS[difficulty] ?? 0);
  const enhanced = Math.min(MAX_ENHANCED_ROLL, roll + bonus);
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
  const chance = DROP_CHANCE[difficulty] ?? 0.5;
  return Math.random() < chance;
};

/** Roll a random item type from all equipment slots */
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
