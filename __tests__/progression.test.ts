import { describe, it, expect } from "vitest";
import {
  xpForLevel,
  XP_REWARD,
  scaleXpByLevel,
  goldForPvPWin,
  goldForPvPLoss,
} from "@/lib/game/progression";

describe("xpForLevel", () => {
  it("returns positive XP for any level", () => {
    for (let i = 1; i <= 50; i++) {
      expect(xpForLevel(i)).toBeGreaterThan(0);
    }
  });

  it("XP requirement increases with level", () => {
    for (let i = 1; i < 30; i++) {
      expect(xpForLevel(i + 1)).toBeGreaterThan(xpForLevel(i));
    }
  });

  it("follows formula: 100 * level^1.8 + 50 * level", () => {
    const level = 10;
    const expected = Math.floor(100 * Math.pow(level, 1.8) + 50 * level);
    expect(xpForLevel(level)).toBe(expected);
  });
});

describe("scaleXpByLevel", () => {
  it("scales XP by enemy level formula", () => {
    const base = 100;
    const level = 10;
    const expected = Math.floor(base * (1 + level / 50));
    expect(scaleXpByLevel(base, level)).toBe(expected);
  });

  it("returns base XP for level 0", () => {
    expect(scaleXpByLevel(100, 0)).toBe(100);
  });

  it("doubles XP at level 50", () => {
    expect(scaleXpByLevel(100, 50)).toBe(200);
  });
});

describe("XP_REWARD constants", () => {
  it("PVP win gives more than loss", () => {
    expect(XP_REWARD.PVP_WIN).toBeGreaterThan(XP_REWARD.PVP_LOSS);
  });

  it("hard dungeon gives more than easy", () => {
    expect(XP_REWARD.HARD_DUNGEON_PER_FLOOR).toBeGreaterThan(XP_REWARD.EASY_DUNGEON_PER_FLOOR);
  });
});

describe("goldForPvPWin", () => {
  it("returns base gold for no streak", () => {
    const gold = goldForPvPWin(1000, 0);
    expect(gold).toBe(100 + Math.floor(1000 / 10));
  });

  it("increases gold with win streak", () => {
    const base = goldForPvPWin(1000, 0);
    const streak2 = goldForPvPWin(1000, 2);
    const streak3 = goldForPvPWin(1000, 3);
    const streak5 = goldForPvPWin(1000, 5);
    expect(streak2).toBeGreaterThan(base);
    expect(streak3).toBeGreaterThan(streak2);
    expect(streak5).toBeGreaterThan(streak3);
  });

  it("scales with opponent rating", () => {
    const lowRating = goldForPvPWin(500, 0);
    const highRating = goldForPvPWin(2000, 0);
    expect(highRating).toBeGreaterThan(lowRating);
  });
});

describe("goldForPvPLoss", () => {
  it("returns 30", () => {
    expect(goldForPvPLoss()).toBe(30);
  });
});
