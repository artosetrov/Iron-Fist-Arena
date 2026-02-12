import type { CharacterClass } from "./types";

export interface AbilityDef {
  id: string;
  name: string;
  unlockLevel: number;
  type: "physical" | "magic" | "buff";
  /** Physical: STR mult. Magic: INT mult. */
  multiplier: number;
  /** For multi-hit */
  hits?: number;
  /** Status to apply: [chance 0-1, duration, type] */
  status?: { chance: number; duration: number; type: string };
  /** Self buff: e.g. { str: 0.3 } for +30% STR */
  selfBuff?: Record<string, number>;
  /** e.g. armorBreak: 0.5 */
  armorBreak?: number;
  /** +crit chance for this attack (additive %) */
  critBonus?: number;
  /** dodge bonus for self (additive %, e.g. 50) */
  dodgeBonus?: number;
  dodgeBonusTurns?: number;
  /** Only if first strike in round */
  firstStrikeOnly?: boolean;
  /** If target HP% < this, auto-crit (e.g. 0.3) */
  executeThreshold?: number;
  cooldown: number;
}

export const ABILITIES: Record<CharacterClass, AbilityDef[]> = {
  warrior: [
    { id: "heavy_strike", name: "Heavy Strike", unlockLevel: 5, type: "physical", multiplier: 2, status: { chance: 0.15, duration: 1, type: "stun" }, cooldown: 3 },
    { id: "battle_cry", name: "Battle Cry", unlockLevel: 10, type: "buff", multiplier: 0, selfBuff: { str: 0.3 }, cooldown: 6 },
    { id: "whirlwind", name: "Whirlwind", unlockLevel: 15, type: "physical", multiplier: 1.5, hits: 2, cooldown: 4 },
    { id: "titan_slam", name: "Titan's Slam", unlockLevel: 20, type: "physical", multiplier: 3.5, armorBreak: 0.5, cooldown: 5 },
  ],
  rogue: [
    { id: "quick_strike", name: "Quick Strike", unlockLevel: 5, type: "physical", multiplier: 1.6, critBonus: 20, cooldown: 2 },
    { id: "shadow_step", name: "Shadow Step", unlockLevel: 10, type: "buff", multiplier: 0, dodgeBonus: 50, dodgeBonusTurns: 2, cooldown: 5 },
    { id: "backstab", name: "Backstab", unlockLevel: 15, type: "physical", multiplier: 2.5, firstStrikeOnly: true, cooldown: 3 },
    { id: "assassinate", name: "Assassinate", unlockLevel: 20, type: "physical", multiplier: 4, executeThreshold: 0.3, cooldown: 6 },
  ],
  mage: [
    { id: "fireball", name: "Fireball", unlockLevel: 5, type: "magic", multiplier: 2.2, status: { chance: 0.18, duration: 3, type: "burn" }, cooldown: 2 },
    { id: "frost_nova", name: "Frost Nova", unlockLevel: 10, type: "magic", multiplier: 1.8, status: { chance: 0.25, duration: 2, type: "slow" }, cooldown: 4 },
    { id: "lightning_strike", name: "Lightning Strike", unlockLevel: 15, type: "magic", multiplier: 2.8, status: { chance: 0.1, duration: 1, type: "stun" }, cooldown: 3 },
    { id: "meteor_storm", name: "Meteor Storm", unlockLevel: 20, type: "magic", multiplier: 3.8, cooldown: 6 },
  ],
  tank: [
    { id: "shield_bash", name: "Shield Bash", unlockLevel: 5, type: "physical", multiplier: 1.4, cooldown: 2 },
    { id: "iron_wall", name: "Iron Wall", unlockLevel: 10, type: "buff", multiplier: 0, selfBuff: { armor: 0.8 }, cooldown: 6 },
    { id: "counter_strike", name: "Counter Strike", unlockLevel: 15, type: "physical", multiplier: 1.2, cooldown: 4 },
    { id: "immovable_object", name: "Immovable Object", unlockLevel: 20, type: "buff", multiplier: 0, selfBuff: { resist: 0.6 }, cooldown: 8 },
  ],
};

export const getAbilitiesForClass = (cls: CharacterClass, level: number): AbilityDef[] => {
  return ABILITIES[cls].filter((a) => a.unlockLevel <= level);
};

export const getAbilityById = (cls: CharacterClass, id: string): AbilityDef | undefined =>
  ABILITIES[cls].find((a) => a.id === id);
