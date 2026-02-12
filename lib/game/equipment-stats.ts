/**
 * Shared utility to aggregate equipment stats from equipped items.
 * Used by equip/unequip APIs and combat routes.
 */

import type { ItemStatKey } from "./item-catalog";

type EquippedItem = {
  item: {
    baseStats: unknown;
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

/** Sum all baseStats from equipped items into a single aggregated object */
export const aggregateEquipmentStats = (
  equipped: EquippedItem[]
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
    for (const k of keys) {
      result[k] += bs[k] ?? bs[k.toLowerCase()] ?? 0;
    }
  }

  return result;
};

/** Extract just the armor value (backwards-compatible helper) */
export const aggregateArmor = (equipped: EquippedItem[]): number => {
  return aggregateEquipmentStats(equipped).ARMOR;
};
