/* ────────────────── Shell Game — Server Logic ────────────────── */

import crypto from "crypto";

/* ── Constants ── */

export const SHELL_GAME_MIN_BET = 50;
export const SHELL_GAME_MAX_BET = 5000;
export const SHELL_GAME_MULTIPLIER = 2;
export const SHELL_GAME_CUPS = 3;
export const SHELL_GAME_MIN_SWAPS = 3;
export const SHELL_GAME_MAX_SWAPS = 7;
export const SHELL_GAME_BET_PRESETS = [50, 100, 250, 500, 1000] as const;

/* ── Types ── */

export type ShellGameSwap = [number, number];

export type ShellGameSecret = {
  initialPosition: number;
  swaps: ShellGameSwap[];
  finalPosition: number;
};

/* ── Generation ── */

/** Cryptographically secure random int in [0, max) */
const secureRandomInt = (max: number): number => {
  const bytes = crypto.randomBytes(4);
  return bytes.readUInt32BE(0) % max;
};

/** Generate a single swap pair (two distinct cup indices) */
const generateSwap = (): ShellGameSwap => {
  const a = secureRandomInt(SHELL_GAME_CUPS);
  let b = secureRandomInt(SHELL_GAME_CUPS - 1);
  if (b >= a) b += 1;
  return [a, b];
};

/** Compute final position of the ball after applying swaps */
export const computeFinalPosition = (
  initialPosition: number,
  swaps: ShellGameSwap[],
): number => {
  let pos = initialPosition;
  for (const [a, b] of swaps) {
    if (pos === a) {
      pos = b;
    } else if (pos === b) {
      pos = a;
    }
  }
  return pos;
};

/** Generate a complete shell game round */
export const generateShellGame = (): ShellGameSecret => {
  const initialPosition = secureRandomInt(SHELL_GAME_CUPS);
  const swapCount =
    SHELL_GAME_MIN_SWAPS +
    secureRandomInt(SHELL_GAME_MAX_SWAPS - SHELL_GAME_MIN_SWAPS + 1);

  const swaps: ShellGameSwap[] = Array.from({ length: swapCount }, () =>
    generateSwap(),
  );

  const finalPosition = computeFinalPosition(initialPosition, swaps);

  return { initialPosition, swaps, finalPosition };
};

/* ── Validation ── */

export const validateBet = (
  amount: number,
): { valid: true } | { valid: false; reason: string } => {
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return { valid: false, reason: "Bet must be a whole number" };
  }
  if (amount < SHELL_GAME_MIN_BET) {
    return { valid: false, reason: `Minimum bet is ${SHELL_GAME_MIN_BET} gold` };
  }
  if (amount > SHELL_GAME_MAX_BET) {
    return { valid: false, reason: `Maximum bet is ${SHELL_GAME_MAX_BET} gold` };
  }
  return { valid: true };
};

export const validateCupChoice = (
  choice: number,
): boolean => {
  return Number.isInteger(choice) && choice >= 0 && choice < SHELL_GAME_CUPS;
};
