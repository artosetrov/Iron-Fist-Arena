/** GDD §4 - Stamina system (logic only — constants in balance.ts) */

import {
  STAMINA_REGEN_MINUTES,
  MAX_STAMINA_BASE,
  MAX_STAMINA_VIP_BONUS,
  OVERFLOW_CAP,
} from "./balance";

// Re-export constants & types for consumers that imported from here
export { STAMINA_REGEN_MINUTES, MAX_STAMINA_BASE, MAX_STAMINA_VIP_BONUS, OVERFLOW_CAP };
export type { StaminaActivity } from "./balance";
export { STAMINA_COST } from "./balance";

/** Compute current stamina from last update time and regen rate */
export const computeCurrentStamina = (params: {
  currentStamina: number;
  maxStamina: number;
  lastStaminaUpdate: Date;
  isVip?: boolean;
}): number => {
  const { currentStamina, maxStamina, lastStaminaUpdate, isVip } = params;
  const cap = isVip ? maxStamina : Math.min(maxStamina, MAX_STAMINA_BASE);
  if (currentStamina >= cap) return Math.min(currentStamina, OVERFLOW_CAP);
  const now = Date.now();
  const elapsedMs = now - new Date(lastStaminaUpdate).getTime();
  const pointsRegenerated = Math.floor(elapsedMs / (STAMINA_REGEN_MINUTES * 60 * 1000));
  return Math.min(cap, currentStamina + pointsRegenerated);
};

/** Update character stamina in DB: regenerate then subtract cost. Returns new current stamina or error. */
export const spendStamina = (params: {
  currentStamina: number;
  maxStamina: number;
  lastStaminaUpdate: Date;
  cost: number;
  isVip?: boolean;
}): { newStamina: number; newLastUpdate: Date } | { error: string } => {
  const { cost, isVip } = params;
  const current = computeCurrentStamina({
    currentStamina: params.currentStamina,
    maxStamina: params.maxStamina,
    lastStaminaUpdate: params.lastStaminaUpdate,
    isVip,
  });
  if (current < cost) {
    return { error: "Not enough stamina" };
  }
  const newStamina = current - cost;
  return {
    newStamina,
    newLastUpdate: new Date(),
  };
};

export const getMaxStamina = (isVip: boolean): number =>
  isVip ? MAX_STAMINA_BASE + MAX_STAMINA_VIP_BONUS : MAX_STAMINA_BASE;

/** Regen then clamp to max; returns values to persist (currentStamina, lastStaminaUpdate). Natural regen pauses when over base cap. */
export const applyRegen = (params: {
  currentStamina: number;
  maxStamina: number;
  lastStaminaUpdate: Date;
  isVip?: boolean;
}): { currentStamina: number; lastStaminaUpdate: Date } => {
  const { isVip } = params;
  const cap = getMaxStamina(!!isVip);
  let current = params.currentStamina;
  const last = new Date(params.lastStaminaUpdate).getTime();
  const now = Date.now();
  if (current < cap) {
    const elapsed = Math.floor((now - last) / (STAMINA_REGEN_MINUTES * 60 * 1000));
    current = Math.min(cap, current + elapsed);
  }
  return {
    currentStamina: Math.min(current, OVERFLOW_CAP),
    lastStaminaUpdate: new Date(now),
  };
};
