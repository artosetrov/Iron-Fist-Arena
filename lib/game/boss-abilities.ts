/** 20 unique boss abilities used across all dungeon bosses.
 *  Compatible with AbilityDef from abilities.ts — same shape, same combat engine. */

import type { AbilityDef } from "./abilities";

/* ─── Physical (7) ─── */

const crushingBlow: AbilityDef = {
  id: "boss_crushing_blow",
  name: "Crushing Blow",
  unlockLevel: 0,
  type: "physical",
  multiplier: 2.2,
  armorBreak: 0.3,
  cooldown: 4,
};

const tailSwipe: AbilityDef = {
  id: "boss_tail_swipe",
  name: "Tail Swipe",
  unlockLevel: 0,
  type: "physical",
  multiplier: 1.4,
  hits: 2,
  cooldown: 3,
};

const frenzy: AbilityDef = {
  id: "boss_frenzy",
  name: "Frenzy",
  unlockLevel: 0,
  type: "physical",
  multiplier: 1.2,
  hits: 3,
  cooldown: 5,
};

const groundSlam: AbilityDef = {
  id: "boss_ground_slam",
  name: "Ground Slam",
  unlockLevel: 0,
  type: "physical",
  multiplier: 2.5,
  status: { chance: 0.25, duration: 1, type: "stun" },
  cooldown: 5,
};

const impale: AbilityDef = {
  id: "boss_impale",
  name: "Impale",
  unlockLevel: 0,
  type: "physical",
  multiplier: 2.0,
  status: { chance: 0.35, duration: 3, type: "bleed" },
  cooldown: 4,
};

const charge: AbilityDef = {
  id: "boss_charge",
  name: "Charge",
  unlockLevel: 0,
  type: "physical",
  multiplier: 2.8,
  firstStrikeOnly: true,
  cooldown: 6,
};

const rend: AbilityDef = {
  id: "boss_rend",
  name: "Rend",
  unlockLevel: 0,
  type: "physical",
  multiplier: 1.6,
  status: { chance: 0.4, duration: 3, type: "bleed" },
  critBonus: 10,
  cooldown: 3,
};

/* ─── Magic (7) ─── */

const shadowBolt: AbilityDef = {
  id: "boss_shadow_bolt",
  name: "Shadow Bolt",
  unlockLevel: 0,
  type: "magic",
  multiplier: 2.4,
  status: { chance: 0.2, duration: 2, type: "weaken" },
  cooldown: 3,
};

const frostBreath: AbilityDef = {
  id: "boss_frost_breath",
  name: "Frost Breath",
  unlockLevel: 0,
  type: "magic",
  multiplier: 2.0,
  status: { chance: 0.3, duration: 2, type: "slow" },
  cooldown: 4,
};

const fireWave: AbilityDef = {
  id: "boss_fire_wave",
  name: "Fire Wave",
  unlockLevel: 0,
  type: "magic",
  multiplier: 1.8,
  hits: 2,
  status: { chance: 0.25, duration: 3, type: "burn" },
  cooldown: 4,
};

const poisonCloud: AbilityDef = {
  id: "boss_poison_cloud",
  name: "Poison Cloud",
  unlockLevel: 0,
  type: "magic",
  multiplier: 1.4,
  status: { chance: 0.45, duration: 4, type: "poison" },
  cooldown: 5,
};

const lifeDrain: AbilityDef = {
  id: "boss_life_drain",
  name: "Life Drain",
  unlockLevel: 0,
  type: "magic",
  multiplier: 2.0,
  status: { chance: 1.0, duration: 2, type: "regen" },
  cooldown: 5,
};

const chainLightning: AbilityDef = {
  id: "boss_chain_lightning",
  name: "Chain Lightning",
  unlockLevel: 0,
  type: "magic",
  multiplier: 1.5,
  hits: 3,
  status: { chance: 0.15, duration: 1, type: "stun" },
  cooldown: 5,
};

const arcaneBurst: AbilityDef = {
  id: "boss_arcane_burst",
  name: "Arcane Burst",
  unlockLevel: 0,
  type: "magic",
  multiplier: 3.2,
  cooldown: 6,
};

/* ─── Buff / Utility (6) ─── */

const enrage: AbilityDef = {
  id: "boss_enrage",
  name: "Enrage",
  unlockLevel: 0,
  type: "buff",
  multiplier: 0,
  selfBuff: { str: 0.35 },
  cooldown: 7,
};

const stoneSkin: AbilityDef = {
  id: "boss_stone_skin",
  name: "Stone Skin",
  unlockLevel: 0,
  type: "buff",
  multiplier: 0,
  selfBuff: { armor: 0.6 },
  cooldown: 6,
};

const darkShield: AbilityDef = {
  id: "boss_dark_shield",
  name: "Dark Shield",
  unlockLevel: 0,
  type: "buff",
  multiplier: 0,
  selfBuff: { resist: 0.5 },
  cooldown: 6,
};

const regeneration: AbilityDef = {
  id: "boss_regeneration",
  name: "Regeneration",
  unlockLevel: 0,
  type: "buff",
  multiplier: 0,
  selfBuff: { regen: 0.08 },
  cooldown: 7,
};

const battleRoar: AbilityDef = {
  id: "boss_battle_roar",
  name: "Battle Roar",
  unlockLevel: 0,
  type: "buff",
  multiplier: 0,
  selfBuff: { str: 0.2 },
  status: { chance: 0.2, duration: 1, type: "stun" },
  cooldown: 6,
};

const haste: AbilityDef = {
  id: "boss_haste",
  name: "Haste",
  unlockLevel: 0,
  type: "buff",
  multiplier: 0,
  dodgeBonus: 35,
  dodgeBonusTurns: 3,
  cooldown: 7,
};

/* ─── All boss abilities indexed by ID ─── */

export const BOSS_ABILITIES: AbilityDef[] = [
  // Physical
  crushingBlow,
  tailSwipe,
  frenzy,
  groundSlam,
  impale,
  charge,
  rend,
  // Magic
  shadowBolt,
  frostBreath,
  fireWave,
  poisonCloud,
  lifeDrain,
  chainLightning,
  arcaneBurst,
  // Buff
  enrage,
  stoneSkin,
  darkShield,
  regeneration,
  battleRoar,
  haste,
];

const bossAbilityMap = new Map<string, AbilityDef>(
  BOSS_ABILITIES.map((a) => [a.id, a]),
);

/** Lookup a boss ability by its id. Returns undefined if not found. */
export const getBossAbilityById = (id: string): AbilityDef | undefined =>
  bossAbilityMap.get(id);
