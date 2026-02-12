/**
 * Gold cost for stat training (exponential progression).
 *
 * Formula: cost = floor(BASE × GROWTH^statValue)
 *
 * Examples:
 *   stat 10 →    81 gold
 *   stat 20 →   133 gold
 *   stat 50 →   573 gold
 *   stat 100 → 6,600 gold
 *   stat 150 → 76,300 gold
 *   stat 200 → 881,400 gold
 *
 * Shared between API route and UI to keep costs in sync.
 */

import { STAT_TRAIN_BASE, STAT_TRAIN_GROWTH } from "./balance";

export const goldCostForStatTraining = (currentValue: number): number =>
  Math.floor(STAT_TRAIN_BASE * Math.pow(STAT_TRAIN_GROWTH, currentValue));
