import type { BaseStats, CharacterOrigin, DerivedStats } from "./types";
import {
  BASE_CRIT_CHANCE,
  MAX_CRIT_CHANCE,
  BASE_DODGE,
  MAX_DODGE,
  BASE_CRIT_DAMAGE,
  MAX_CRIT_DAMAGE_MULT,
  ARMOR_REDUCTION_CAP,
  MAGIC_RESIST_CAP,
  HP_PER_VIT,
  ARMOR_DENOMINATOR,
  MAGIC_RESIST_DENOM,
} from "./constants";
import { applyOriginBonuses } from "./origins";

/** GDD §2.1 - Max HP from VIT */
export const getMaxHp = (vit: number): number => {
  return Math.max(100, vit * HP_PER_VIT);
};

/** Armor damage reduction: Armor / (Armor + 100), cap 0.75 */
export const getArmorReduction = (armor: number): number => {
  if (armor <= 0) return 0;
  return Math.min(ARMOR_REDUCTION_CAP, armor / (armor + ARMOR_DENOMINATOR));
};

/** Magic resist: MIN(0.70, WIS / (WIS + 150)) */
export const getMagicResistPercent = (wis: number): number => {
  if (wis <= 0) return 0;
  return Math.min(MAGIC_RESIST_CAP, wis / (wis + MAGIC_RESIST_DENOM));
};

/** Crit chance % = 5 + AGI/10 + LCK/15 + equipment, max 50% */
export const getCritChance = (
  agi: number,
  lck: number,
  equipmentBonus: number = 0
): number => {
  const total =
    BASE_CRIT_CHANCE + agi / 10 + lck / 15 + equipmentBonus;
  return Math.min(MAX_CRIT_CHANCE, Math.max(0, total));
};

/** Crit damage mult = 1.5 + STR/500 + equipment%, max 2.8 */
export const getCritDamageMult = (
  str: number,
  equipmentPercent: number = 0
): number => {
  const total = BASE_CRIT_DAMAGE + str / 500 + equipmentPercent / 100;
  return Math.min(MAX_CRIT_DAMAGE_MULT, total);
};

/** Dodge % = 3 + AGI/8 + equipment, max 40% */
export const getDodgeChance = (agi: number, equipmentBonus: number = 0): number => {
  const total = BASE_DODGE + agi / 8 + equipmentBonus;
  return Math.min(MAX_DODGE, Math.max(0, total));
};

/** Compute all derived stats from base stats and optional armor values */
export const computeDerivedStats = (
  base: BaseStats,
  armorValue: number = 0,
  magicResistValue: number = 0,
  critEquipmentBonus: number = 0,
  critDmgEquipmentPercent: number = 0,
  dodgeEquipmentBonus: number = 0
): DerivedStats => {
  const maxHp = getMaxHp(base.vitality);
  return {
    maxHp,
    critChance: getCritChance(base.agility, base.luck, critEquipmentBonus),
    critDamageMult: getCritDamageMult(base.strength, critDmgEquipmentPercent),
    dodgeChance: getDodgeChance(base.agility, dodgeEquipmentBonus),
    armor: armorValue,
    magicResist: getMagicResistPercent(base.wisdom) * 100,
  };
};

/** Base stats from character (all 10 at start, then allocated) */
export const baseStatsFromCharacter = (c: {
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
}): BaseStats => ({
  strength: c.strength,
  agility: c.agility,
  vitality: c.vitality,
  endurance: c.endurance,
  intelligence: c.intelligence,
  wisdom: c.wisdom,
  luck: c.luck,
  charisma: c.charisma,
});

/** Get effective base stats with origin bonuses applied */
export const getEffectiveStats = (
  c: {
    strength: number;
    agility: number;
    vitality: number;
    endurance: number;
    intelligence: number;
    wisdom: number;
    luck: number;
    charisma: number;
  },
  origin?: CharacterOrigin
): BaseStats => {
  const raw = baseStatsFromCharacter(c);
  if (!origin) return raw;
  return applyOriginBonuses(raw, origin);
};
