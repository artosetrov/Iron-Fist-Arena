/**
 * Gold cost for stat training (exponential progression).
 *
 * Formula: cost = floor(50 × 1.05^statValue)
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
export const goldCostForStatTraining = (currentValue: number): number =>
  Math.floor(50 * Math.pow(1.05, currentValue));
