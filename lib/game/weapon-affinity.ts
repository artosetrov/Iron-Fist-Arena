/**
 * Weapon Class Affinity system.
 * Characters get +15% to weapon stats when using their "native" weapon category.
 */

import type { WeaponCategory } from "./item-catalog";
import { getCatalogItemById } from "./item-catalog";

/** Bonus multiplier applied to weapon stats when class matches category */
export const WEAPON_AFFINITY_BONUS = 0.15;

/** Mapping: character class -> recommended weapon category */
export const CLASS_WEAPON_AFFINITY: Record<string, WeaponCategory> = {
  warrior: "sword",
  rogue: "dagger",
  tank: "mace",
  mage: "staff",
};

/** Determine weapon category from item data (catalog lookup + description + name fallback) */
export const getWeaponCategory = (item: {
  catalogId?: string | null;
  description?: string | null;
  itemName?: string;
  itemType?: string;
}): WeaponCategory | null => {
  // 1. Catalog lookup
  if (item.catalogId) {
    const cat = getCatalogItemById(item.catalogId);
    if (cat?.weaponCategory) return cat.weaponCategory;
  }
  // 2. Description field (catalog weapons store "Sword"/"Dagger"/"Mace"/"Staff")
  const desc = item.description?.toLowerCase();
  if (desc === "sword") return "sword";
  if (desc === "dagger") return "dagger";
  if (desc === "mace") return "mace";
  if (desc === "staff") return "staff";
  // 3. Item name fallback (e.g. "Rusted Sword", "Iron Dagger", etc.)
  const name = item.itemName?.toLowerCase() ?? "";
  if (name.includes("sword") || name.includes("blade") || name.includes("saber") || name.includes("cutter")) return "sword";
  if (name.includes("dagger") || name.includes("knife") || name.includes("shiv") || name.includes("fang") || name.includes("talon")) return "dagger";
  if (name.includes("mace") || name.includes("hammer") || name.includes("maul") || name.includes("crusher") || name.includes("club")) return "mace";
  if (name.includes("staff") || name.includes("rod") || name.includes("scepter") || name.includes("channeler")) return "staff";
  return null;
};

/** Check if character class matches weapon category */
export const hasWeaponAffinity = (
  characterClass: string,
  weaponCategory: WeaponCategory,
): boolean => CLASS_WEAPON_AFFINITY[characterClass] === weaponCategory;
