/** GDD Extension — Character Races (passive bonuses layer) */

import type { BaseStats } from "./types";

/* ────────────────── Types ────────────────── */

export type CharacterOrigin =
  | "human"
  | "orc"
  | "skeleton"
  | "demon"
  | "dogfolk";

export interface OriginStatModifiers {
  /** Percentage modifiers per stat. E.g. 0.05 = +5% */
  strength?: number;
  agility?: number;
  vitality?: number;
  endurance?: number;
  intelligence?: number;
  wisdom?: number;
  luck?: number;
  charisma?: number;
}

export interface OriginDef {
  id: CharacterOrigin;
  label: string;
  icon: string;
  description: string;
  bonusDescription: string;
  statModifiers: OriginStatModifiers;
  /** Special passive ability (not stat-based) */
  passive?: {
    id: string;
    name: string;
    chance: number;
    description: string;
  };
}

/* ────────────────── Constants ────────────────── */

export const ALL_ORIGINS: CharacterOrigin[] = [
  "human",
  "orc",
  "skeleton",
  "demon",
  "dogfolk",
];

export { ORIGIN_CHANGE_COST } from "./balance";

/* ────────────────── Origin Definitions ────────────────── */

export const ORIGIN_DEFS: Record<CharacterOrigin, OriginDef> = {
  human: {
    id: "human",
    label: "Human",
    icon: "🧑",
    description: "Versatile and adaptable, balanced in all aspects",
    bonusDescription: "+5% to all stats",
    statModifiers: {
      strength: 0.05,
      agility: 0.05,
      vitality: 0.05,
      endurance: 0.05,
      intelligence: 0.05,
      wisdom: 0.05,
      luck: 0.05,
      charisma: 0.05,
    },
  },
  orc: {
    id: "orc",
    label: "Orc",
    icon: "👹",
    description: "Brutal warriors, feared for their raw strength",
    bonusDescription: "+8% STR, -3% END",
    statModifiers: {
      strength: 0.08,
      endurance: -0.03,
    },
  },
  skeleton: {
    id: "skeleton",
    label: "Skeleton",
    icon: "💀",
    description: "Undead remnants, swift and eerily lucky",
    bonusDescription: "+6% AGI, +4% LCK",
    statModifiers: {
      agility: 0.06,
      luck: 0.04,
    },
  },
  demon: {
    id: "demon",
    label: "Demon",
    icon: "😈",
    description: "Infernal beings, armored in hellfire and resilience",
    bonusDescription: "+8% END, +5% VIT",
    statModifiers: {
      endurance: 0.08,
      vitality: 0.05,
    },
  },
  dogfolk: {
    id: "dogfolk",
    label: "Dogfolk",
    icon: "🐕",
    description: "Loyal canine warriors — they refuse to stay down",
    bonusDescription: "5% chance to cheat death (survive at 1 HP)",
    statModifiers: {},
    passive: {
      id: "cheating_death",
      name: "Cheating Death",
      chance: 0.05,
      description: "5% chance to survive a killing blow with 1 HP",
    },
  },
};

/* ────────────────── UI Style Maps ────────────────── */

export const ORIGIN_GRADIENT: Record<CharacterOrigin, string> = {
  human: "from-amber-600/20 to-yellow-600/20",
  orc: "from-red-600/20 to-rose-600/20",
  skeleton: "from-purple-600/20 to-fuchsia-600/20",
  demon: "from-cyan-600/20 to-blue-600/20",
  dogfolk: "from-orange-600/20 to-yellow-600/20",
};

export const ORIGIN_BORDER: Record<CharacterOrigin, string> = {
  human: "border-amber-500/40 hover:border-amber-400/60",
  orc: "border-red-500/40 hover:border-red-400/60",
  skeleton: "border-purple-500/40 hover:border-purple-400/60",
  demon: "border-cyan-500/40 hover:border-cyan-400/60",
  dogfolk: "border-orange-500/40 hover:border-orange-400/60",
};

export const ORIGIN_ACCENT: Record<CharacterOrigin, string> = {
  human: "text-amber-400",
  orc: "text-red-400",
  skeleton: "text-purple-400",
  demon: "text-cyan-400",
  dogfolk: "text-orange-400",
};

/* ────────────────── Logic ────────────────── */

/** Apply origin percentage bonuses to base stats. No stacking multiplier. */
export const applyOriginBonuses = (
  baseStats: BaseStats,
  origin: CharacterOrigin
): BaseStats => {
  const def = ORIGIN_DEFS[origin];
  if (!def) return { ...baseStats };

  const mods = def.statModifiers;

  return {
    strength: Math.floor(baseStats.strength * (1 + (mods.strength ?? 0))),
    agility: Math.floor(baseStats.agility * (1 + (mods.agility ?? 0))),
    vitality: Math.floor(baseStats.vitality * (1 + (mods.vitality ?? 0))),
    endurance: Math.floor(baseStats.endurance * (1 + (mods.endurance ?? 0))),
    intelligence: Math.floor(baseStats.intelligence * (1 + (mods.intelligence ?? 0))),
    wisdom: Math.floor(baseStats.wisdom * (1 + (mods.wisdom ?? 0))),
    luck: Math.floor(baseStats.luck * (1 + (mods.luck ?? 0))),
    charisma: Math.floor(baseStats.charisma * (1 + (mods.charisma ?? 0))),
  };
};

/** Check if origin has the cheating_death passive */
export const hasCheatDeath = (origin: CharacterOrigin): boolean => {
  return ORIGIN_DEFS[origin]?.passive?.id === "cheating_death";
};

/** Get cheating_death chance (0 if origin doesn't have it) */
export const getCheatDeathChance = (origin: CharacterOrigin): number => {
  const def = ORIGIN_DEFS[origin];
  if (def?.passive?.id === "cheating_death") return def.passive.chance;
  return 0;
};
