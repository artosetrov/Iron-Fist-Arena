import { describe, it, expect } from "vitest";
import { expectedScore, ratingChange, getRankFromRating } from "@/lib/game/elo";

describe("expectedScore", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
  });

  it("returns higher value for higher-rated player", () => {
    const score = expectedScore(1200, 1000);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(1);
  });

  it("returns lower value for lower-rated player", () => {
    const score = expectedScore(1000, 1200);
    expect(score).toBeLessThan(0.5);
    expect(score).toBeGreaterThan(0);
  });

  it("expected scores of opponents sum to 1", () => {
    const a = expectedScore(1200, 1000);
    const b = expectedScore(1000, 1200);
    expect(a + b).toBeCloseTo(1, 5);
  });
});

describe("ratingChange", () => {
  it("returns positive change for win", () => {
    const change = ratingChange(1000, 1000, 1);
    expect(change).toBeGreaterThan(0);
  });

  it("returns negative change for loss", () => {
    const change = ratingChange(1000, 1000, 0);
    expect(change).toBeLessThan(0);
  });

  it("win and loss changes sum to 0 for equal ratings", () => {
    const win = ratingChange(1000, 1000, 1);
    const loss = ratingChange(1000, 1000, 0);
    expect(win + loss).toBe(0);
  });

  it("win against higher-rated gives more points", () => {
    const easyWin = ratingChange(1200, 1000, 1); // expected to win
    const hardWin = ratingChange(1000, 1200, 1); // expected to lose
    expect(hardWin).toBeGreaterThan(easyWin);
  });

  it("uses K=32", () => {
    // Equal ratings: expected = 0.5, change = 32 * (1 - 0.5) = 16
    const change = ratingChange(1000, 1000, 1);
    expect(change).toBe(16);
  });
});

describe("getRankFromRating", () => {
  it("returns Bronze for low rating", () => {
    expect(getRankFromRating(0)).toBe("Bronze");
    expect(getRankFromRating(500)).toBe("Bronze");
    expect(getRankFromRating(1099)).toBe("Bronze");
  });

  it("returns Silver for 1100-1299", () => {
    expect(getRankFromRating(1100)).toBe("Silver");
    expect(getRankFromRating(1200)).toBe("Silver");
    expect(getRankFromRating(1299)).toBe("Silver");
  });

  it("returns Gold for 1300-1499", () => {
    expect(getRankFromRating(1300)).toBe("Gold");
  });

  it("returns Platinum for 1500-1699", () => {
    expect(getRankFromRating(1500)).toBe("Platinum");
  });

  it("returns Diamond for 1700-1899", () => {
    expect(getRankFromRating(1700)).toBe("Diamond");
  });

  it("returns Master for 1900-2099", () => {
    expect(getRankFromRating(1900)).toBe("Master");
  });

  it("returns Grandmaster for 2100+", () => {
    expect(getRankFromRating(2100)).toBe("Grandmaster");
    expect(getRankFromRating(9999)).toBe("Grandmaster");
  });
});
