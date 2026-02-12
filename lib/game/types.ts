export type CharacterClass = "warrior" | "rogue" | "mage" | "tank";

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
  | "berserk";

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
