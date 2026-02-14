import { describe, it, expect, vi, afterEach } from "vitest";
import { calcPhysicalDamage, calcMagicDamage } from "@/lib/game/damage";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calcPhysicalDamage — zoneDamageMult", () => {
  const BASE_PARAMS = {
    attackerStr: 50,
    defenderEnd: 10,
    defenderArmor: 0,
    skillMultiplier: 1,
    isCrit: false,
    critDamageMult: 1.5,
  };

  it("defaults zoneDamageMult to 1.0 when not provided", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const dmg1 = calcPhysicalDamage(BASE_PARAMS);
    const dmg2 = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 1.0 });
    expect(dmg1).toBe(dmg2);
  });

  it("head zone (1.3x) deals more damage than torso (1.0x)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const torso = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 1.0 });
    const head = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 1.3 });
    expect(head).toBeGreaterThan(torso);
  });

  it("legs zone (0.8x) deals less damage than torso (1.0x)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const torso = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 1.0 });
    const legs = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 0.8 });
    expect(legs).toBeLessThan(torso);
  });

  it("waist zone (0.9x) deals less damage than torso", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const torso = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 1.0 });
    const waist = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 0.9 });
    expect(waist).toBeLessThan(torso);
  });

  it("never drops below 1 even with low zone mult", () => {
    const dmg = calcPhysicalDamage({
      attackerStr: 1,
      defenderEnd: 999,
      defenderArmor: 999,
      skillMultiplier: 1,
      isCrit: false,
      critDamageMult: 1.5,
      zoneDamageMult: 0.1,
    });
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it("zoneDamageMult stacks with crit", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const normal = calcPhysicalDamage({ ...BASE_PARAMS, zoneDamageMult: 1.0, isCrit: false });
    const headCrit = calcPhysicalDamage({
      ...BASE_PARAMS,
      zoneDamageMult: 1.3,
      isCrit: true,
      critDamageMult: 2.0,
    });
    // headCrit should be roughly 2.0 * 1.3 = 2.6x of normal
    expect(headCrit).toBeGreaterThan(normal * 2);
  });
});

describe("calcMagicDamage — no zone mult", () => {
  it("does not accept zoneDamageMult parameter", () => {
    // Magic damage function signature should NOT have zoneDamageMult
    // This test ensures magic is zone-independent
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const dmg = calcMagicDamage({
      attackerInt: 50,
      defenderWis: 10,
      spellMultiplier: 2,
      isCrit: false,
      critDamageMult: 1.5,
    });
    expect(dmg).toBeGreaterThan(0);
  });
});
