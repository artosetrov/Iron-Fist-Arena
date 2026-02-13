/**
 * Shared utility to aggregate equipment stats from equipped items.
 * Used by equip/unequip APIs and combat routes.
 *
 * Supports weapon class affinity: +15% to weapon stats when character class
 * matches the weapon's recommended category.
 */

import type { ItemStatKey } from "./item-catalog";
import {
  WEAPON_AFFINITY_BONUS,
  getWeaponCategory,
  hasWeaponAffinity,
} from "./weapon-affinity";

type EquippedItem = {
  equippedSlot?: string | null;
  item: {
    baseStats: unknown;
    itemType?: string;
    catalogId?: string | null;
    description?: string | null;
    itemName?: string;
  };
  upgradeLevel?: number;
};

export type AggregatedEquipmentStats = {
  ATK: number;
  DEF: number;
  HP: number;
  CRIT: number;
  SPEED: number;
  ARMOR: number;
};

/**
 * Sum all baseStats from equipped items into a single aggregated object.
 * When `characterClass` is provided, weapons matching the class affinity
 * receive a +15% bonus to all their stats.
 */
export const aggregateEquipmentStats = (
  equipped: EquippedItem[],
  characterClass?: string,
): AggregatedEquipmentStats => {
  const result: AggregatedEquipmentStats = {
    ATK: 0,
    DEF: 0,
    HP: 0,
    CRIT: 0,
    SPEED: 0,
    ARMOR: 0,
  };

  const keys: ItemStatKey[] = ["ATK", "DEF", "HP", "CRIT", "SPEED", "ARMOR"];

  for (const eq of equipped) {
    const bs = eq.item.baseStats as Record<string, number> | null;
    if (!bs) continue;

    // Determine if this weapon gets affinity bonus
    const isWeaponSlot =
      eq.equippedSlot === "weapon" ||
      eq.equippedSlot === "weapon_offhand" ||
      eq.item.itemType === "weapon";

    let affinityMult = 1;
    if (isWeaponSlot && characterClass) {
      const category = getWeaponCategory(eq.item);
      if (category && hasWeaponAffinity(characterClass, category)) {
        affinityMult = 1 + WEAPON_AFFINITY_BONUS;
      }
    }

    for (const k of keys) {
      const raw = bs[k] ?? bs[k.toLowerCase()] ?? 0;
      result[k] += Math.floor(raw * affinityMult);
    }
  }

  return result;
};

/** Extract just the armor value (backwards-compatible helper) */
export const aggregateArmor = (equipped: EquippedItem[]): number => {
  return aggregateEquipmentStats(equipped).ARMOR;
};
