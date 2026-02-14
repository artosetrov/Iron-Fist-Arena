import { describe, it, expect, vi, afterEach } from "vitest";
import {
  defaultStance,
  validateStance,
  resolveHitZone,
  calcBlockReduction,
  computeZoneArmor,
  generateRandomStance,
  generateBossStance,
  SLOT_TO_ZONE,
  totalArmorFromZones,
} from "@/lib/game/body-zones";
import { MAX_BLOCK_POINTS, BODY_ZONES, ZONE_HIT_WEIGHT } from "@/lib/game/balance";
import type { CombatStance, BodyZone } from "@/lib/game/types";

afterEach(() => {
  vi.restoreAllMocks();
});

/* ══════════════════════════════════════════
   defaultStance
   ══════════════════════════════════════════ */
describe("defaultStance", () => {
  it("returns a valid stance", () => {
    const stance = defaultStance();
    expect(stance.attackZones).toEqual(["torso"]);
    expect(stance.blockAllocation).toEqual({ head: 1, torso: 1, waist: 1, legs: 0 });
  });

  it("block points sum to MAX_BLOCK_POINTS", () => {
    const stance = defaultStance();
    const sum = BODY_ZONES.reduce((s, z) => s + stance.blockAllocation[z], 0);
    expect(sum).toBe(MAX_BLOCK_POINTS);
  });
});

/* ══════════════════════════════════════════
   validateStance
   ══════════════════════════════════════════ */
describe("validateStance", () => {
  it("accepts a valid stance with 1 attack zone", () => {
    const stance: CombatStance = {
      attackZones: ["head"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(validateStance(stance)).toBeNull();
  });

  it("accepts a valid stance with 2 attack zones", () => {
    const stance: CombatStance = {
      attackZones: ["head", "torso"],
      blockAllocation: { head: 0, torso: 0, waist: 0, legs: 3 },
    };
    expect(validateStance(stance)).toBeNull();
  });

  it("rejects 0 attack zones", () => {
    const stance: CombatStance = {
      attackZones: [],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects 3 attack zones", () => {
    const stance = {
      attackZones: ["head", "torso", "waist"] as BodyZone[],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects duplicate attack zones", () => {
    const stance: CombatStance = {
      attackZones: ["head", "head"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects invalid zone name", () => {
    const stance = {
      attackZones: ["face" as BodyZone],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects block points not summing to MAX_BLOCK_POINTS", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: 1, torso: 1, waist: 0, legs: 0 }, // sum = 2
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects negative block points", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: -1, torso: 2, waist: 2, legs: 0 },
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects block points > MAX_BLOCK_POINTS on single zone", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: 4, torso: 0, waist: 0, legs: 0 },
    };
    expect(validateStance(stance)).not.toBeNull();
  });

  it("rejects null/undefined stance", () => {
    expect(validateStance(null as unknown as CombatStance)).not.toBeNull();
    expect(validateStance(undefined as unknown as CombatStance)).not.toBeNull();
  });

  it("accepts max block points on single zone", () => {
    const stance: CombatStance = {
      attackZones: ["head"],
      blockAllocation: { head: 3, torso: 0, waist: 0, legs: 0 },
    };
    expect(validateStance(stance)).toBeNull();
  });
});

/* ══════════════════════════════════════════
   resolveHitZone
   ══════════════════════════════════════════ */
describe("resolveHitZone", () => {
  it("returns the single attack zone on focus bonus hit", () => {
    // Force focus bonus to trigger (Math.random < 0.15)
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    const stance: CombatStance = {
      attackZones: ["head"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(resolveHitZone(stance)).toBe("head");
  });

  it("returns one of the attack zones on weighted roll", () => {
    const stance: CombatStance = {
      attackZones: ["head", "legs"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    for (let i = 0; i < 50; i++) {
      const zone = resolveHitZone(stance);
      expect(["head", "legs"]).toContain(zone);
    }
  });

  it("never returns a zone not in attackZones (dual-zone)", () => {
    const stance: CombatStance = {
      attackZones: ["torso", "waist"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    for (let i = 0; i < 100; i++) {
      const zone = resolveHitZone(stance);
      expect(["torso", "waist"]).toContain(zone);
    }
  });

  it("single zone: mostly hits chosen zone over many rolls", () => {
    const stance: CombatStance = {
      attackZones: ["head"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    let headHits = 0;
    for (let i = 0; i < 200; i++) {
      if (resolveHitZone(stance) === "head") headHits++;
    }
    // Single zone always returns the chosen zone (focus bonus OR weighted random with only 1 option)
    expect(headHits).toBe(200);
  });
});

/* ══════════════════════════════════════════
   calcBlockReduction
   ══════════════════════════════════════════ */
describe("calcBlockReduction", () => {
  it("returns 0 for unblocked zone", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(calcBlockReduction("legs", stance)).toBe(0);
  });

  it("returns 0.25 for 1 block point", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 },
    };
    expect(calcBlockReduction("head", stance)).toBe(0.25);
  });

  it("returns 0.50 for 2 block points", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: 2, torso: 1, waist: 0, legs: 0 },
    };
    expect(calcBlockReduction("head", stance)).toBe(0.5);
  });

  it("returns 0.75 for 3 block points (max)", () => {
    const stance: CombatStance = {
      attackZones: ["torso"],
      blockAllocation: { head: 3, torso: 0, waist: 0, legs: 0 },
    };
    expect(calcBlockReduction("head", stance)).toBe(0.75);
  });
});

/* ══════════════════════════════════════════
   computeZoneArmor
   ══════════════════════════════════════════ */
describe("computeZoneArmor", () => {
  it("returns zeroes for empty array", () => {
    const result = computeZoneArmor([]);
    expect(result).toEqual({ head: 0, torso: 0, waist: 0, legs: 0 });
  });

  it("assigns armor to correct zone for helmet", () => {
    const items = [{ equippedSlot: "helmet", baseStats: { ARMOR: 40 } }];
    const result = computeZoneArmor(items);
    expect(result.head).toBe(40);
    expect(result.torso).toBe(0);
  });

  it("assigns armor to correct zone for chest", () => {
    const items = [{ equippedSlot: "chest", baseStats: { ARMOR: 100 } }];
    const result = computeZoneArmor(items);
    expect(result.torso).toBe(100);
    expect(result.head).toBe(0);
  });

  it("assigns armor to correct zone for belt", () => {
    const items = [{ equippedSlot: "belt", baseStats: { ARMOR: 20 } }];
    const result = computeZoneArmor(items);
    expect(result.waist).toBe(20);
  });

  it("assigns armor to correct zone for boots + legs", () => {
    const items = [
      { equippedSlot: "boots", baseStats: { ARMOR: 15 } },
      { equippedSlot: "legs", baseStats: { ARMOR: 25 } },
    ];
    const result = computeZoneArmor(items);
    expect(result.legs).toBe(40);
  });

  it("splits weapon armor evenly across all zones", () => {
    const items = [{ equippedSlot: "weapon", baseStats: { ARMOR: 40 } }];
    const result = computeZoneArmor(items);
    expect(result.head).toBe(10);
    expect(result.torso).toBe(10);
    expect(result.waist).toBe(10);
    expect(result.legs).toBe(10);
  });

  it("combines zone-specific and shared armor", () => {
    const items = [
      { equippedSlot: "helmet", baseStats: { ARMOR: 30 } },
      { equippedSlot: "accessory", baseStats: { ARMOR: 20 } }, // shared: 5 per zone
    ];
    const result = computeZoneArmor(items);
    expect(result.head).toBe(35); // 30 + 5
    expect(result.torso).toBe(5);
    expect(result.waist).toBe(5);
    expect(result.legs).toBe(5);
  });

  it("handles items with no ARMOR stat", () => {
    const items = [{ equippedSlot: "helmet", baseStats: { ATK: 10 } }];
    const result = computeZoneArmor(items);
    expect(result.head).toBe(0);
  });

  it("handles lowercase armor key", () => {
    const items = [{ equippedSlot: "chest", baseStats: { armor: 50 } }];
    const result = computeZoneArmor(items);
    expect(result.torso).toBe(50);
  });
});

/* ══════════════════════════════════════════
   totalArmorFromZones
   ══════════════════════════════════════════ */
describe("totalArmorFromZones", () => {
  it("sums all zones", () => {
    const total = totalArmorFromZones({ head: 10, torso: 20, waist: 15, legs: 5 });
    expect(total).toBe(50);
  });

  it("returns 0 for all zeroes", () => {
    expect(totalArmorFromZones({ head: 0, torso: 0, waist: 0, legs: 0 })).toBe(0);
  });
});

/* ══════════════════════════════════════════
   generateRandomStance
   ══════════════════════════════════════════ */
describe("generateRandomStance", () => {
  it("produces valid stances", () => {
    for (let i = 0; i < 50; i++) {
      const stance = generateRandomStance();
      expect(validateStance(stance)).toBeNull();
    }
  });

  it("has 1-2 attack zones", () => {
    for (let i = 0; i < 50; i++) {
      const stance = generateRandomStance();
      expect(stance.attackZones.length).toBeGreaterThanOrEqual(1);
      expect(stance.attackZones.length).toBeLessThanOrEqual(2);
    }
  });

  it("block points sum to MAX_BLOCK_POINTS", () => {
    for (let i = 0; i < 50; i++) {
      const stance = generateRandomStance();
      const sum = BODY_ZONES.reduce((s, z) => s + stance.blockAllocation[z], 0);
      expect(sum).toBe(MAX_BLOCK_POINTS);
    }
  });
});

/* ══════════════════════════════════════════
   generateBossStance
   ══════════════════════════════════════════ */
describe("generateBossStance", () => {
  it("returns valid stance for known archetype", () => {
    const stance = generateBossStance("aggressive");
    expect(validateStance(stance)).toBeNull();
    expect(stance.attackZones).toEqual(["head"]);
  });

  it("returns valid stance for unknown archetype (random fallback)", () => {
    for (let i = 0; i < 20; i++) {
      const stance = generateBossStance("nonexistent");
      expect(validateStance(stance)).toBeNull();
    }
  });

  it("returns valid stance with no archetype", () => {
    for (let i = 0; i < 20; i++) {
      const stance = generateBossStance();
      expect(validateStance(stance)).toBeNull();
    }
  });

  it("defensive archetype has balanced blocks", () => {
    const stance = generateBossStance("defensive");
    expect(stance.attackZones).toEqual(["torso", "waist"]);
    expect(stance.blockAllocation.head).toBe(1);
    expect(stance.blockAllocation.torso).toBe(1);
  });
});

/* ══════════════════════════════════════════
   SLOT_TO_ZONE mapping
   ══════════════════════════════════════════ */
describe("SLOT_TO_ZONE", () => {
  it("maps helmet to head", () => {
    expect(SLOT_TO_ZONE["helmet"]).toBe("head");
  });

  it("maps chest and gloves to torso", () => {
    expect(SLOT_TO_ZONE["chest"]).toBe("torso");
    expect(SLOT_TO_ZONE["gloves"]).toBe("torso");
  });

  it("maps belt to waist", () => {
    expect(SLOT_TO_ZONE["belt"]).toBe("waist");
  });

  it("maps legs and boots to legs", () => {
    expect(SLOT_TO_ZONE["legs"]).toBe("legs");
    expect(SLOT_TO_ZONE["boots"]).toBe("legs");
  });

  it("returns null for weapon and accessories", () => {
    expect(SLOT_TO_ZONE["weapon"]).toBeNull();
    expect(SLOT_TO_ZONE["accessory"]).toBeNull();
    expect(SLOT_TO_ZONE["amulet"]).toBeNull();
    expect(SLOT_TO_ZONE["ring"]).toBeNull();
    expect(SLOT_TO_ZONE["necklace"]).toBeNull();
    expect(SLOT_TO_ZONE["relic"]).toBeNull();
  });
});
