/** GDD §6.2 - ELO rating system (logic only — constants in balance.ts) */

import {
  ELO_K,
  RATING_FLOOR,
  LOSS_STREAK_THRESHOLD,
  LOSS_STREAK_REDUCTION,
  RANK_TIERS,
  BOSS_KILL_RATING_BASE,
  BOSS_KILL_RATING_PER_LEVEL,
  DUNGEON_COMPLETE_RATING_BASE,
  DUNGEON_COMPLETE_RATING_PER_LEVEL,
} from "./balance";

// Re-export for consumers
export { RATING_FLOOR };

export const expectedScore = (yourRating: number, oppRating: number): number => {
  return 1 / (1 + Math.pow(10, (oppRating - yourRating) / 400));
};

export const ratingChange = (
  yourRating: number,
  oppRating: number,
  actual: number
): number => {
  const expected = expectedScore(yourRating, oppRating);
  return Math.round(ELO_K * (actual - expected));
};

/* ------------------------------------------------------------------ */
/*  Loss protection                                                   */
/*  - Rating cannot drop below 0 (absolute floor)                     */
/*  - Loss streak >= 3: -50% rating loss                              */
/* ------------------------------------------------------------------ */
export const applyLossProtection = (
  currentRating: number,
  delta: number,
  lossStreak: number
): number => {
  if (delta >= 0) return delta;

  // Floor: rating at 0 cannot drop further
  if (currentRating <= RATING_FLOOR) return 0;

  let adjusted = delta;

  // Loss streak 3+: halve the loss
  if (lossStreak >= LOSS_STREAK_THRESHOLD) {
    adjusted = Math.round(adjusted * LOSS_STREAK_REDUCTION);
  }

  // Never drop below the floor
  const resultRating = currentRating + adjusted;
  if (resultRating < RATING_FLOOR) {
    adjusted = RATING_FLOOR - currentRating;
  }

  return adjusted;
};

/* ------------------------------------------------------------------ */
/*  GDD §6.3 — Rank tiers with divisions V → I                       */
/* ------------------------------------------------------------------ */

const DIVISION_LABELS = ["V", "IV", "III", "II", "I"] as const;

/**
 * Bronze is special per GDD:
 *   V: 0-999, IV: 1000-1019, III: 1020-1039, II: 1040-1059, I: 1060-1099
 * Others with divisions have a 200-wide range split into 5×40.
 */
const getBronzeDivision = (rating: number): string => {
  if (rating < 1000) return "V";
  if (rating < 1020) return "IV";
  if (rating < 1040) return "III";
  if (rating < 1060) return "II";
  return "I";
};

const getStandardDivision = (rating: number, tierFloor: number, tierRange: number): string => {
  const divSize = tierRange / 5;
  const idx = Math.min(4, Math.floor((rating - tierFloor) / divSize));
  return DIVISION_LABELS[idx];
};

/** Get full rank string with division, e.g. "Gold III" or "Master" */
export const getRankFromRating = (rating: number): string => {
  for (const tier of RANK_TIERS) {
    if (rating >= tier.floor) {
      if (!tier.divisions) return tier.name;

      const division =
        tier.name === "Bronze"
          ? getBronzeDivision(rating)
          : getStandardDivision(rating, tier.floor, tier.ceiling - tier.floor);

      return `${tier.name} ${division}`;
    }
  }
  return "Bronze V";
};

/* ------------------------------------------------------------------ */
/*  rankOrder — numeric value for comparing rank strings              */
/*  Higher number = better rank. Used for highestPvpRank comparison.  */
/* ------------------------------------------------------------------ */

const TIER_BASE: Record<string, number> = {
  Bronze: 0,
  Silver: 100,
  Gold: 200,
  Platinum: 300,
  Diamond: 400,
  Master: 500,
  Grandmaster: 600,
};

const DIVISION_VALUE: Record<string, number> = {
  V: 0,
  IV: 1,
  III: 2,
  II: 3,
  I: 4,
};

/** Convert a rank string like "Gold III" to a comparable number (higher = better). */
export const rankOrder = (rank: string): number => {
  const parts = rank.split(" ");
  const tierName = parts[0];
  const divLabel = parts[1]; // may be undefined for Master / Grandmaster

  const base = TIER_BASE[tierName] ?? 0;
  const div = divLabel ? (DIVISION_VALUE[divLabel] ?? 0) : 0;

  return base + div;
};

/* ------------------------------------------------------------------ */
/*  Dungeon rating reward — scales with boss level                    */
/* ------------------------------------------------------------------ */

/** Rating points earned for defeating a dungeon boss. */
export const ratingForBossKill = (bossLevel: number): number => {
  return BOSS_KILL_RATING_BASE + Math.floor(bossLevel * BOSS_KILL_RATING_PER_LEVEL);
};

/** Bonus rating for completing an entire dungeon (all bosses). */
export const ratingForDungeonComplete = (dungeonMinLevel: number): number => {
  return DUNGEON_COMPLETE_RATING_BASE + Math.floor(dungeonMinLevel * DUNGEON_COMPLETE_RATING_PER_LEVEL);
};
