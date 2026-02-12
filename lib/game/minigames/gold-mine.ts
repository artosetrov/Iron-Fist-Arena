/* ────────────────── Gold Mine — Idle Mini-game Logic ────────────────── */

import {
  GOLD_MINE_DURATION_MS,
  GOLD_MINE_VIP_DURATION_MS,
  GOLD_MINE_BASE_REWARD,
  GOLD_MINE_LEVEL_MULT,
  GOLD_MINE_FREE_SLOTS,
  GOLD_MINE_MAX_SLOTS,
} from "../balance";

/** Calculate gold reward for a mining session */
export const calculateReward = (level: number): number =>
  GOLD_MINE_BASE_REWARD + level * GOLD_MINE_LEVEL_MULT;

/** Get mining duration in milliseconds based on VIP status */
export const getMiningDuration = (isVip: boolean): number =>
  isVip ? GOLD_MINE_VIP_DURATION_MS : GOLD_MINE_DURATION_MS;

/** Get max available slots (free + purchased, capped at MAX) */
export const getMaxSlots = (purchasedSlots: number): number =>
  Math.min(GOLD_MINE_FREE_SLOTS + purchasedSlots, GOLD_MINE_MAX_SLOTS);

/** Check if a session has finished mining */
export const isSessionReady = (endsAt: Date): boolean =>
  Date.now() >= new Date(endsAt).getTime();

/** Check if VIP is active based on premiumUntil */
export const isVip = (premiumUntil: Date | null | undefined): boolean => {
  if (!premiumUntil) return false;
  return new Date(premiumUntil).getTime() > Date.now();
};
