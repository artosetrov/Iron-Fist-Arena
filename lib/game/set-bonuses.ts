/**
 * Legendary Set Bonuses — Item System v1.0
 *
 * 4 class sets, each with 2-piece and 4-piece bonuses.
 * Bonuses are computed at runtime from equipped items.
 */

import type { SetName } from "./item-catalog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SetBonusType =
  | "atk_percent"
  | "crit_chance"
  | "crit_damage"
  | "damage_percent"
  | "damage_reduction"
  | "extra_turn_chance";

export type SetBonusEffect = {
  type: SetBonusType;
  value: number;
};

export type SetBonusDefinition = {
  setName: SetName;
  piecesRequired: number;
  label: string;
  bonus: SetBonusEffect;
};

export type ActiveSetBonus = {
  setName: SetName;
  equippedCount: number;
  bonuses: SetBonusDefinition[];
};

/* ------------------------------------------------------------------ */
/*  Set Bonus Definitions                                              */
/* ------------------------------------------------------------------ */

export const SET_BONUS_DEFINITIONS: SetBonusDefinition[] = [
  // Warrior — Crimson Conqueror
  {
    setName: "crimson_conqueror",
    piecesRequired: 2,
    label: "+5% ATK",
    bonus: { type: "atk_percent", value: 5 },
  },
  {
    setName: "crimson_conqueror",
    piecesRequired: 4,
    label: "+10% Total Damage",
    bonus: { type: "damage_percent", value: 10 },
  },

  // Rogue — Shadow Reaper
  {
    setName: "shadow_reaper",
    piecesRequired: 2,
    label: "+8% Crit Chance",
    bonus: { type: "crit_chance", value: 8 },
  },
  {
    setName: "shadow_reaper",
    piecesRequired: 4,
    label: "15% Extra Turn Chance",
    bonus: { type: "extra_turn_chance", value: 15 },
  },

  // Mage — Arcane Dominion
  {
    setName: "arcane_dominion",
    piecesRequired: 2,
    label: "+10% Crit Damage",
    bonus: { type: "crit_damage", value: 10 },
  },
  {
    setName: "arcane_dominion",
    piecesRequired: 4,
    label: "+12% Total Damage",
    bonus: { type: "damage_percent", value: 12 },
  },

  // Tank — Iron Bastion
  {
    setName: "iron_bastion",
    piecesRequired: 2,
    label: "-5% Damage Taken",
    bonus: { type: "damage_reduction", value: 5 },
  },
  {
    setName: "iron_bastion",
    piecesRequired: 4,
    label: "-10% Damage Taken",
    bonus: { type: "damage_reduction", value: 10 },
  },
];

/* ------------------------------------------------------------------ */
/*  Runtime computation                                                */
/* ------------------------------------------------------------------ */

type EquippedItemInfo = {
  setName: string | null;
};

/**
 * Given a list of currently equipped items (with their setName),
 * returns all active set bonuses.
 *
 * When 4 pieces of the same set are equipped, BOTH 2-piece and 4-piece
 * bonuses are active (they stack).
 */
export const getActiveSetBonuses = (
  equippedItems: EquippedItemInfo[]
): ActiveSetBonus[] => {
  // Count pieces per set
  const setCounts = new Map<string, number>();
  for (const item of equippedItems) {
    if (!item.setName) continue;
    setCounts.set(item.setName, (setCounts.get(item.setName) ?? 0) + 1);
  }

  const result: ActiveSetBonus[] = [];

  for (const [setName, count] of setCounts) {
    const matchingBonuses = SET_BONUS_DEFINITIONS.filter(
      (def) => def.setName === setName && count >= def.piecesRequired
    );

    if (matchingBonuses.length === 0) continue;

    result.push({
      setName: setName as SetName,
      equippedCount: count,
      bonuses: matchingBonuses,
    });
  }

  return result;
};

/**
 * Flatten all active set bonuses into a single effects map.
 * For damage_reduction, values are summed (2-piece + 4-piece = 15% for Iron Bastion).
 */
export const flattenSetBonuses = (
  activeBonuses: ActiveSetBonus[]
): Map<SetBonusType, number> => {
  const effects = new Map<SetBonusType, number>();

  for (const active of activeBonuses) {
    for (const def of active.bonuses) {
      const current = effects.get(def.bonus.type) ?? 0;
      effects.set(def.bonus.type, current + def.bonus.value);
    }
  }

  return effects;
};

/**
 * Get set bonus definitions for a specific set (for UI display).
 */
export const getSetBonusesForSet = (
  setName: SetName
): SetBonusDefinition[] =>
  SET_BONUS_DEFINITIONS.filter((def) => def.setName === setName);

/** Human-readable set names */
export const SET_DISPLAY_NAMES: Record<SetName, string> = {
  crimson_conqueror: "Crimson Conqueror",
  shadow_reaper: "Shadow Reaper",
  arcane_dominion: "Arcane Dominion",
  iron_bastion: "Iron Bastion",
};

/** Which class each set belongs to */
export const SET_CLASS_MAP: Record<SetName, string> = {
  crimson_conqueror: "warrior",
  shadow_reaper: "rogue",
  arcane_dominion: "mage",
  iron_bastion: "tank",
};
