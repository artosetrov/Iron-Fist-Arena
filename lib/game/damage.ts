import { getArmorReduction, getMagicResistPercent } from "./stats";
import {
  DAMAGE_VARIANCE_MIN,
  DAMAGE_VARIANCE_MAX,
  WIS_DEFENSE_FACTOR,
  END_DEFENSE_FACTOR,
} from "./constants";

/** Random variance 0.95 - 1.05 */
const randomVariance = (): number =>
  DAMAGE_VARIANCE_MIN +
  Math.random() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);

/**
 * GDD §2.1 Physical damage:
 * Base = (STR * skillMult) - (DefENDER_END * 0.5)
 * Effective = Base * (1 - armorReduction) * critMult * variance
 */
export const calcPhysicalDamage = (params: {
  attackerStr: number;
  defenderEnd: number;
  defenderArmor: number;
  skillMultiplier: number;
  isCrit: boolean;
  critDamageMult: number;
}): number => {
  const {
    attackerStr,
    defenderEnd,
    defenderArmor,
    skillMultiplier,
    isCrit,
    critDamageMult,
  } = params;
  const base = Math.max(
    1,
    attackerStr * skillMultiplier - defenderEnd * END_DEFENSE_FACTOR
  );
  const armorReduction = getArmorReduction(defenderArmor);
  const critMult = isCrit ? critDamageMult : 1;
  const variance = randomVariance();
  return Math.max(1, Math.floor(base * (1 - armorReduction) * critMult * variance));
};

/**
 * GDD §2.1 Magic damage:
 * Base = (INT * spellMult) - (WIS * 0.4)
 * Effective = Base * (1 - magicResist) * critMult * elementMod
 */
export const calcMagicDamage = (params: {
  attackerInt: number;
  defenderWis: number;
  spellMultiplier: number;
  isCrit: boolean;
  critDamageMult: number;
  elementMod?: number;
}): number => {
  const {
    attackerInt,
    defenderWis,
    spellMultiplier,
    isCrit,
    critDamageMult,
    elementMod = 1,
  } = params;
  const base = Math.max(
    1,
    attackerInt * spellMultiplier - defenderWis * WIS_DEFENSE_FACTOR
  );
  const magicResist = getMagicResistPercent(defenderWis);
  const critMult = isCrit ? critDamageMult : 1;
  const variance = randomVariance();
  return Math.max(
    1,
    Math.floor(base * (1 - magicResist) * critMult * elementMod * variance)
  );
};

/** Roll crit: true if random 0-100 < critChance */
export const rollCrit = (critChance: number): boolean =>
  Math.random() * 100 < critChance;

/** Roll dodge: true if random 0-100 < dodgeChance */
export const rollDodge = (dodgeChance: number): boolean =>
  Math.random() * 100 < dodgeChance;
