export type CharacterClass = "warrior" | "rogue" | "mage" | "tank";

/* ── Body Zone Combat System ── */

export type BodyZone = "head" | "torso" | "waist" | "legs";

export interface CombatStance {
  /** 1-2 zones to target with attacks */
  attackZones: BodyZone[];
  /** Block point allocation across zones (sum must equal MAX_BLOCK_POINTS = 3) */
  blockAllocation: Record<BodyZone, number>;
}

export type CharacterOrigin =
  | "human"
  | "orc"
  | "skeleton"
  | "demon"
  | "dogfolk";

export interface BaseStats {
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
}

export interface DerivedStats {
  maxHp: number;
  critChance: number;
  critDamageMult: number;
  dodgeChance: number;
  armor: number;
  magicResist: number;
}

export type StatusEffectType =
  | "bleed"
  | "poison"
  | "stun"
  | "burn"
  | "slow"
  | "weaken"
  | "armor_break"
  | "blind"
  | "regen"
  | "berserk"
  | "str_buff"
  | "armor_buff"
  | "resist_buff"
  | "dodge_buff";

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  value?: number;
}

export interface CombatantState {
  id: string;
  name: string;
  class: CharacterClass;
  origin?: CharacterOrigin;
  level: number;
  baseStats: BaseStats;
  derived: DerivedStats;
  currentHp: number;
  maxHp: number;
  armor: number;
  magicResist: number;
  statusEffects: StatusEffect[];
  isFirstStrike?: boolean;
  abilityCooldowns: Record<string, number>;
  /** Boss-specific ability IDs (from boss-catalog). Undefined for players. */
  bossAbilityIds?: string[];
  /** Body zone combat stance (attack targets + block allocation) */
  stance: CombatStance;
  /** Per-zone armor values computed from equipped items */
  zoneArmor: Record<BodyZone, number>;
}

export interface CombatLogEntry {
  turn: number;
  actorId: string;
  targetId: string;
  action: "basic" | string;
  damage?: number;
  healed?: number;
  dodge?: boolean;
  crit?: boolean;
  statusApplied?: StatusEffectType;
  statusTicks?: { type: StatusEffectType; damage?: number; healed?: number }[];
  message: string;
  /** HP snapshot after this action */
  actorHpAfter?: number;
  targetHpAfter?: number;
  /** Body zone hit by this attack */
  bodyZone?: BodyZone;
  /** Whether the hit landed on a blocked zone */
  blocked?: boolean;
  /** Block damage reduction applied (0-0.75) */
  blockReduction?: number;
}

export interface CombatantSnapshot {
  id: string;
  name: string;
  class: CharacterClass;
  origin?: CharacterOrigin;
  level: number;
  currentHp: number;
  maxHp: number;
  baseStats: BaseStats;
}

export interface CombatResult {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: CombatLogEntry[];
  playerSnapshot: CombatantSnapshot;
  enemySnapshot: CombatantSnapshot;
}
