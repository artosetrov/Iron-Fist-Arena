import { describe, it, expect } from "vitest";
import {
  expectedScore,
  ratingChange,
  getRankFromRating,
  rankOrder,
  applyLossProtection,
  RATING_FLOOR,
  ratingForBossKill,
  ratingForDungeonComplete,
} from "@/lib/game/elo";

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

describe("getRankFromRating — divisions (GDD §6.3)", () => {
  it("returns Bronze V for 0-999", () => {
    expect(getRankFromRating(0)).toBe("Bronze V");
    expect(getRankFromRating(500)).toBe("Bronze V");
    expect(getRankFromRating(999)).toBe("Bronze V");
  });

  it("returns Bronze IV for 1000-1019", () => {
    expect(getRankFromRating(1000)).toBe("Bronze IV");
    expect(getRankFromRating(1019)).toBe("Bronze IV");
  });

  it("returns Bronze III for 1020-1039", () => {
    expect(getRankFromRating(1020)).toBe("Bronze III");
    expect(getRankFromRating(1039)).toBe("Bronze III");
  });

  it("returns Bronze II for 1040-1059", () => {
    expect(getRankFromRating(1040)).toBe("Bronze II");
    expect(getRankFromRating(1059)).toBe("Bronze II");
  });

  it("returns Bronze I for 1060-1099", () => {
    expect(getRankFromRating(1060)).toBe("Bronze I");
    expect(getRankFromRating(1099)).toBe("Bronze I");
  });

  it("returns Silver V for 1100", () => {
    expect(getRankFromRating(1100)).toBe("Silver V");
  });

  it("returns Silver I for top of Silver range", () => {
    expect(getRankFromRating(1260)).toBe("Silver I");
    expect(getRankFromRating(1299)).toBe("Silver I");
  });

  it("returns Gold V for 1300", () => {
    expect(getRankFromRating(1300)).toBe("Gold V");
  });

  it("returns Platinum V for 1500", () => {
    expect(getRankFromRating(1500)).toBe("Platinum V");
  });

  it("returns Diamond V for 1700", () => {
    expect(getRankFromRating(1700)).toBe("Diamond V");
  });

  it("returns Master (no division) for 1900-2099", () => {
    expect(getRankFromRating(1900)).toBe("Master");
    expect(getRankFromRating(2099)).toBe("Master");
  });

  it("returns Grandmaster (no division) for 2100+", () => {
    expect(getRankFromRating(2100)).toBe("Grandmaster");
    expect(getRankFromRating(9999)).toBe("Grandmaster");
  });
});

describe("rankOrder", () => {
  it("higher rank has higher order", () => {
    expect(rankOrder("Silver V")).toBeGreaterThan(rankOrder("Bronze I"));
    expect(rankOrder("Gold V")).toBeGreaterThan(rankOrder("Silver I"));
    expect(rankOrder("Master")).toBeGreaterThan(rankOrder("Diamond I"));
    expect(rankOrder("Grandmaster")).toBeGreaterThan(rankOrder("Master"));
  });

  it("divisions within a tier are ordered I > II > III > IV > V", () => {
    expect(rankOrder("Bronze I")).toBeGreaterThan(rankOrder("Bronze II"));
    expect(rankOrder("Bronze II")).toBeGreaterThan(rankOrder("Bronze III"));
    expect(rankOrder("Bronze III")).toBeGreaterThan(rankOrder("Bronze IV"));
    expect(rankOrder("Bronze IV")).toBeGreaterThan(rankOrder("Bronze V"));
  });

  it("equal ranks have equal order", () => {
    expect(rankOrder("Gold III")).toBe(rankOrder("Gold III"));
  });
});

describe("applyLossProtection", () => {
  it("returns positive delta unchanged", () => {
    expect(applyLossProtection(1200, 16, 0)).toBe(16);
  });

  it("returns 0 delta if rating is at floor (0)", () => {
    expect(applyLossProtection(0, -16, 0)).toBe(0);
  });

  it("halves loss when loss streak >= 3", () => {
    expect(applyLossProtection(1200, -16, 3)).toBe(-8);
    expect(applyLossProtection(1200, -16, 5)).toBe(-8);
  });

  it("does not halve loss when streak < 3", () => {
    expect(applyLossProtection(1200, -16, 2)).toBe(-16);
  });

  it("clamps result to not drop below floor (0)", () => {
    // Rating 5, delta -16 → would go to -11, should clamp to 0 → delta = -5
    expect(applyLossProtection(5, -16, 0)).toBe(-5);
  });

  it("RATING_FLOOR is 0", () => {
    expect(RATING_FLOOR).toBe(0);
  });
});

describe("ratingForBossKill", () => {
  it("returns base 5 + bossLevel * 2", () => {
    expect(ratingForBossKill(1)).toBe(7);   // 5 + 1*2
    expect(ratingForBossKill(10)).toBe(25);  // 5 + 10*2
    expect(ratingForBossKill(50)).toBe(105); // 5 + 50*2
  });

  it("scales with higher boss levels", () => {
    expect(ratingForBossKill(20)).toBeGreaterThan(ratingForBossKill(10));
  });
});

describe("ratingForDungeonComplete", () => {
  it("returns base 10 + dungeonMinLevel * 0.5", () => {
    expect(ratingForDungeonComplete(1)).toBe(10);   // 10 + floor(1*0.5)
    expect(ratingForDungeonComplete(10)).toBe(15);  // 10 + floor(10*0.5)
    expect(ratingForDungeonComplete(40)).toBe(30);  // 10 + floor(40*0.5)
  });
});
