/**
 * ═══════════════════════════════════════════════════════════════════
 *  Iron Fist Arena — Body Zone Combat System
 *  MyCombats-style zone targeting, blocking, and per-zone armor.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BodyZone, CombatStance } from "./types";
import {
  BODY_ZONES,
  ZONE_HIT_WEIGHT,
  ZONE_FOCUS_BONUS,
  MAX_BLOCK_POINTS,
  BLOCK_REDUCTION_PER_POINT,
} from "./balance";

/* ──────────────────────────────────────────────────────────────────────
   Slot → Zone mapping
   ────────────────────────────────────────────────────────────────────── */

/** Maps equipment slots to body zones. Slots not listed give "shared" armor. */
export const SLOT_TO_ZONE: Record<string, BodyZone | null> = {
  helmet: "head",
  chest: "torso",
  gloves: "torso",
  legs: "legs",
  boots: "legs",
  belt: "waist",
  // Slots without a specific zone — armor is split evenly
  weapon: null,
  weapon_offhand: null,
  accessory: null,
  amulet: null,
  relic: null,
  necklace: null,
  ring: null,
};

/* ──────────────────────────────────────────────────────────────────────
   Default & Validation
   ────────────────────────────────────────────────────────────────────── */

/** Default balanced stance: attack torso, 1 block on head/torso/waist */
export const defaultStance = (): CombatStance => ({
  attackZones: ["torso"],
  blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
});

/** Validate stance integrity. Returns error string or null if valid. */
export const validateStance = (stance: CombatStance): string | null => {
  if (!stance || typeof stance !== "object") return "Invalid stance object";

  const { attackZones, blockAllocation } = stance;

  // Attack zones: 1-2 valid zones
  if (!Array.isArray(attackZones) || attackZones.length < 1 || attackZones.length > 2) {
    return "Must select 1-2 attack zones";
  }
  const uniqueAttack = new Set(attackZones);
  if (uniqueAttack.size !== attackZones.length) return "Duplicate attack zones";
  for (const z of attackZones) {
    if (!BODY_ZONES.includes(z)) return `Invalid attack zone: ${z}`;
  }

  // Block allocation: each 0-3, sum = MAX_BLOCK_POINTS
  if (!blockAllocation || typeof blockAllocation !== "object") {
    return "Invalid block allocation";
  }
  let sum = 0;
  for (const zone of BODY_ZONES) {
    const val = blockAllocation[zone];
    if (typeof val !== "number" || val < 0 || val > MAX_BLOCK_POINTS || !Number.isInteger(val)) {
      return `Invalid block value for ${zone}: ${val}`;
    }
    sum += val;
  }
  if (sum !== MAX_BLOCK_POINTS) {
    return `Block points must sum to ${MAX_BLOCK_POINTS}, got ${sum}`;
  }

  return null;
};

/* ──────────────────────────────────────────────────────────────────────
   Zone Resolution (Attack)
   ────────────────────────────────────────────────────────────────────── */

/**
 * Resolve which body zone an attack hits based on attacker's stance.
 * Single-zone focus gets a hit bonus; dual-zone spreads via weighted random.
 */
export const resolveHitZone = (attackerStance: CombatStance): BodyZone => {
  const { attackZones } = attackerStance;

  if (attackZones.length === 1) {
    // Single-zone focus: ZONE_FOCUS_BONUS chance to land on chosen zone,
    // otherwise fallback to weighted random across all zones
    if (Math.random() < ZONE_FOCUS_BONUS) {
      return attackZones[0];
    }
  }

  // Build weighted pool from attacker's chosen zones
  const weights: { zone: BodyZone; weight: number }[] = attackZones.map((z) => ({
    zone: z,
    weight: ZONE_HIT_WEIGHT[z],
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.zone;
  }

  // Fallback (should not happen)
  return attackZones[attackZones.length - 1];
};

/* ──────────────────────────────────────────────────────────────────────
   Block Reduction
   ────────────────────────────────────────────────────────────────────── */

/**
 * Calculate damage reduction from block points on the hit zone.
 * Returns 0..0.75 (0 = no block, 0.75 = 3 block points).
 */
export const calcBlockReduction = (
  zone: BodyZone,
  defenderStance: CombatStance,
): number => {
  const points = defenderStance.blockAllocation[zone] ?? 0;
  return Math.min(points * BLOCK_REDUCTION_PER_POINT, MAX_BLOCK_POINTS * BLOCK_REDUCTION_PER_POINT);
};

/* ──────────────────────────────────────────────────────────────────────
   Per-Zone Armor Calculation
   ────────────────────────────────────────────────────────────────────── */

type EquippedItemForZone = {
  equippedSlot: string | null;
  baseStats: Record<string, number>;
};

/**
 * Compute per-zone armor from equipped items.
 * Items with a zone-mapped slot contribute ARMOR to that zone.
 * Items without a zone (weapons, accessories) split ARMOR evenly across all 4 zones.
 */
export const computeZoneArmor = (
  equippedItems: EquippedItemForZone[],
): Record<BodyZone, number> => {
  const zoneArmor: Record<BodyZone, number> = { head: 0, torso: 0, waist: 0, legs: 0 };
  let sharedArmor = 0;

  for (const item of equippedItems) {
    const armor = item.baseStats?.ARMOR ?? item.baseStats?.armor ?? 0;
    if (armor <= 0) continue;

    const slot = item.equippedSlot;
    const zone = slot ? SLOT_TO_ZONE[slot] ?? null : null;

    if (zone) {
      zoneArmor[zone] += armor;
    } else {
      sharedArmor += armor;
    }
  }

  // Distribute shared armor evenly
  const perZoneShare = Math.floor(sharedArmor / BODY_ZONES.length);
  for (const zone of BODY_ZONES) {
    zoneArmor[zone] += perZoneShare;
  }

  return zoneArmor;
};

/**
 * Compute flat total armor from zone armor record (for backward compat).
 */
export const totalArmorFromZones = (zoneArmor: Record<BodyZone, number>): number =>
  BODY_ZONES.reduce((sum, z) => sum + zoneArmor[z], 0);

/* ──────────────────────────────────────────────────────────────────────
   AI / Boss Stance Generation
   ────────────────────────────────────────────────────────────────────── */

/** Generate a random valid stance for AI opponents without a saved stance */
export const generateRandomStance = (): CombatStance => {
  // Random 1-2 attack zones
  const shuffled = [...BODY_ZONES].sort(() => Math.random() - 0.5);
  const numAttack = Math.random() < 0.5 ? 1 : 2;
  const attackZones = shuffled.slice(0, numAttack);

  // Random block allocation
  const blockAllocation: Record<BodyZone, number> = { head: 0, torso: 0, waist: 0, legs: 0 };
  let remaining = MAX_BLOCK_POINTS;
  const blockZones = [...BODY_ZONES].sort(() => Math.random() - 0.5);
  for (const zone of blockZones) {
    if (remaining <= 0) break;
    const points = Math.min(remaining, Math.floor(Math.random() * 3) + 1);
    blockAllocation[zone] = points;
    remaining -= points;
  }
  // If points remain after loop, dump onto first zone with room
  if (remaining > 0) {
    for (const zone of BODY_ZONES) {
      const canAdd = MAX_BLOCK_POINTS - blockAllocation[zone];
      const add = Math.min(remaining, canAdd);
      blockAllocation[zone] += add;
      remaining -= add;
      if (remaining <= 0) break;
    }
  }

  return { attackZones, blockAllocation };
};

/** Predefined boss stances by archetype */
const BOSS_STANCE_PRESETS: Record<string, CombatStance> = {
  aggressive: {
    attackZones: ["head"],
    blockAllocation: { head: 0, torso: 2, waist: 1, legs: 0 },
  },
  defensive: {
    attackZones: ["torso", "waist"],
    blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
  },
  berserker: {
    attackZones: ["head", "torso"],
    blockAllocation: { head: 0, torso: 0, waist: 1, legs: 2 },
  },
  tank: {
    attackZones: ["torso"],
    blockAllocation: { head: 1, torso: 2, waist: 0, legs: 0 },
  },
  assassin: {
    attackZones: ["head", "waist"],
    blockAllocation: { head: 0, torso: 0, waist: 1, legs: 2 },
  },
};

/**
 * Get a boss stance from preset or generate random.
 * @param archetype - optional boss archetype key
 */
export const generateBossStance = (archetype?: string): CombatStance => {
  if (archetype && BOSS_STANCE_PRESETS[archetype]) {
    return { ...BOSS_STANCE_PRESETS[archetype] };
  }
  return generateRandomStance();
};
