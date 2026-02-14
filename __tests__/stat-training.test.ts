import { describe, it, expect } from "vitest";
import { goldCostForStatTraining } from "@/lib/game/stat-training";
import { STAT_TRAIN_BASE, STAT_TRAIN_GROWTH } from "@/lib/game/balance";

describe("goldCostForStatTraining", () => {
  it("returns BASE for stat value 0", () => {
    // floor(50 * 1.05^0) = 50
    expect(goldCostForStatTraining(0)).toBe(STAT_TRAIN_BASE);
  });

  it("returns correct cost for stat value 10", () => {
    const expected = Math.floor(STAT_TRAIN_BASE * Math.pow(STAT_TRAIN_GROWTH, 10));
    expect(goldCostForStatTraining(10)).toBe(expected);
  });

  it("returns correct cost for stat value 50", () => {
    const expected = Math.floor(STAT_TRAIN_BASE * Math.pow(STAT_TRAIN_GROWTH, 50));
    expect(goldCostForStatTraining(50)).toBe(expected);
  });

  it("returns correct cost for stat value 100", () => {
    const expected = Math.floor(STAT_TRAIN_BASE * Math.pow(STAT_TRAIN_GROWTH, 100));
    expect(goldCostForStatTraining(100)).toBe(expected);
  });

  it("cost increases exponentially with stat value", () => {
    const cost10 = goldCostForStatTraining(10);
    const cost50 = goldCostForStatTraining(50);
    const cost100 = goldCostForStatTraining(100);
    expect(cost50).toBeGreaterThan(cost10);
    expect(cost100).toBeGreaterThan(cost50);
    // Exponential growth: cost100/cost50 should be much larger than cost50/cost10
    expect(cost100 / cost50).toBeGreaterThan(cost50 / cost10);
  });

  it("always returns an integer", () => {
    for (let s = 0; s <= 200; s += 10) {
      expect(Number.isInteger(goldCostForStatTraining(s))).toBe(true);
    }
  });
});
