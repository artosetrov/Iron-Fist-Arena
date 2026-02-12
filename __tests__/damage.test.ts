import { describe, it, expect, vi, beforeEach } from "vitest";
import { calcPhysicalDamage, calcMagicDamage, rollCrit, rollDodge } from "@/lib/game/damage";

describe("calcPhysicalDamage", () => {
  it("returns at least 1 damage", () => {
    const dmg = calcPhysicalDamage({
      attackerStr: 1,
      defenderEnd: 999,
      defenderArmor: 999,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it("scales with attacker STR", () => {
    const low = calcPhysicalDamage({
      attackerStr: 10,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    const high = calcPhysicalDamage({
      attackerStr: 100,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("applies crit multiplier", () => {
    // Fix random for consistent results
    vi.spyOn(Math, "random").mockReturnValue(0.5); // variance = 1.0
    const normal = calcPhysicalDamage({
      attackerStr: 50,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 2.0,
    });
    const crit = calcPhysicalDamage({
      attackerStr: 50,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 1,
      isCrit: true,
      critDamageMult: 2.0,
    });
    expect(crit).toBeGreaterThanOrEqual(normal * 1.8); // roughly 2x
    vi.restoreAllMocks();
  });

  it("reduces damage with armor", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const noArmor = calcPhysicalDamage({
      attackerStr: 50,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    const withArmor = calcPhysicalDamage({
      attackerStr: 50,
      defenderEnd: 10,
      defenderArmor: 100,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(withArmor).toBeLessThan(noArmor);
    vi.restoreAllMocks();
  });

  it("applies skill multiplier", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const x1 = calcPhysicalDamage({
      attackerStr: 50,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    const x3 = calcPhysicalDamage({
      attackerStr: 50,
      defenderEnd: 10,
      defenderArmor: 0,
      skillMultiplier: 3,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(x3).toBeGreaterThan(x1 * 2);
    vi.restoreAllMocks();
  });
});

describe("calcMagicDamage", () => {
  it("returns at least 1 damage", () => {
    const dmg = calcMagicDamage({
      attackerInt: 1,
      defenderWis: 999,
      spellMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it("scales with INT", () => {
    const low = calcMagicDamage({
      attackerInt: 10,
      defenderWis: 10,
      spellMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    const high = calcMagicDamage({
      attackerInt: 100,
      defenderWis: 10,
      spellMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("applies element modifier", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const base = calcMagicDamage({
      attackerInt: 50,
      defenderWis: 10,
      spellMultiplier: 2,
      isCrit: false,
      critDamageMult: 1.5,
      elementMod: 1.0,
    });
    const boosted = calcMagicDamage({
      attackerInt: 50,
      defenderWis: 10,
      spellMultiplier: 2,
      isCrit: false,
      critDamageMult: 1.5,
      elementMod: 1.5,
    });
    expect(boosted).toBeGreaterThan(base);
    vi.restoreAllMocks();
  });
});

describe("rollCrit", () => {
  it("returns true when roll is below critChance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    expect(rollCrit(10)).toBe(true);
    vi.restoreAllMocks();
  });

  it("returns false when roll is above critChance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(rollCrit(10)).toBe(false);
    vi.restoreAllMocks();
  });

  it("0% crit never crits", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.001);
    expect(rollCrit(0)).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("rollDodge", () => {
  it("returns true when roll is below dodgeChance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    expect(rollDodge(10)).toBe(true);
    vi.restoreAllMocks();
  });

  it("returns false when roll is above dodgeChance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(rollDodge(10)).toBe(false);
    vi.restoreAllMocks();
  });
});
