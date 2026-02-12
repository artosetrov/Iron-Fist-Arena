import { describe, it, expect } from "vitest";
import {
  getMaxHp,
  getArmorReduction,
  getMagicResistPercent,
  getCritChance,
  getCritDamageMult,
  getDodgeChance,
  computeDerivedStats,
} from "@/lib/game/stats";

describe("getMaxHp", () => {
  it("returns minimum 100", () => {
    expect(getMaxHp(0)).toBe(100);
    expect(getMaxHp(5)).toBe(100);
  });

  it("scales with vitality (10 HP per VIT)", () => {
    expect(getMaxHp(20)).toBe(200);
    expect(getMaxHp(50)).toBe(500);
  });
});

describe("getArmorReduction", () => {
  it("returns 0 for 0 armor", () => {
    expect(getArmorReduction(0)).toBe(0);
  });

  it("returns 0 for negative armor", () => {
    expect(getArmorReduction(-10)).toBe(0);
  });

  it("follows formula: armor / (armor + 100)", () => {
    expect(getArmorReduction(100)).toBeCloseTo(0.5, 5);
    expect(getArmorReduction(50)).toBeCloseTo(50 / 150, 5);
  });

  it("caps at 0.75", () => {
    expect(getArmorReduction(99999)).toBe(0.75);
  });
});

describe("getMagicResistPercent", () => {
  it("returns 0 for 0 WIS", () => {
    expect(getMagicResistPercent(0)).toBe(0);
  });

  it("follows formula: WIS / (WIS + 150)", () => {
    expect(getMagicResistPercent(150)).toBeCloseTo(0.5, 5);
  });

  it("caps at 0.70", () => {
    expect(getMagicResistPercent(99999)).toBe(0.7);
  });
});

describe("getCritChance", () => {
  it("has base 5%", () => {
    expect(getCritChance(0, 0)).toBe(5);
  });

  it("scales with AGI and LCK", () => {
    const base = getCritChance(0, 0);
    const withAgi = getCritChance(100, 0);
    const withBoth = getCritChance(100, 100);
    expect(withAgi).toBeGreaterThan(base);
    expect(withBoth).toBeGreaterThan(withAgi);
  });

  it("caps at 50%", () => {
    expect(getCritChance(9999, 9999)).toBe(50);
  });

  it("never goes below 0", () => {
    expect(getCritChance(-100, -100)).toBeGreaterThanOrEqual(0);
  });
});

describe("getCritDamageMult", () => {
  it("has base 1.5x", () => {
    expect(getCritDamageMult(0)).toBeCloseTo(1.5, 5);
  });

  it("caps at 2.8x", () => {
    expect(getCritDamageMult(99999)).toBe(2.8);
  });
});

describe("getDodgeChance", () => {
  it("has base 3%", () => {
    expect(getDodgeChance(0)).toBe(3);
  });

  it("scales with AGI", () => {
    expect(getDodgeChance(80)).toBeGreaterThan(getDodgeChance(0));
  });

  it("caps at 40%", () => {
    expect(getDodgeChance(99999)).toBe(40);
  });
});

describe("computeDerivedStats", () => {
  it("computes all derived stats from base stats", () => {
    const base = {
      strength: 50,
      agility: 30,
      vitality: 40,
      endurance: 20,
      intelligence: 10,
      wisdom: 25,
      luck: 15,
      charisma: 10,
    };
    const derived = computeDerivedStats(base, 50, 0);
    expect(derived.maxHp).toBe(400); // 40 * 10
    expect(derived.critChance).toBeGreaterThan(5);
    expect(derived.critDamageMult).toBeGreaterThan(1.5);
    expect(derived.dodgeChance).toBeGreaterThan(3);
    expect(derived.armor).toBe(50);
    expect(derived.magicResist).toBeGreaterThan(0);
  });
});
