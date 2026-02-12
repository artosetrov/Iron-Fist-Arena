import { describe, it, expect } from "vitest";
import {
  ABILITIES,
  getAbilitiesForClass,
  getAbilityById,
} from "@/lib/game/abilities";

describe("ABILITIES", () => {
  it("defines abilities for all 4 classes", () => {
    expect(ABILITIES.warrior).toBeDefined();
    expect(ABILITIES.rogue).toBeDefined();
    expect(ABILITIES.mage).toBeDefined();
    expect(ABILITIES.tank).toBeDefined();
  });

  it("each class has 4 abilities", () => {
    expect(ABILITIES.warrior.length).toBe(4);
    expect(ABILITIES.rogue.length).toBe(4);
    expect(ABILITIES.mage.length).toBe(4);
    expect(ABILITIES.tank.length).toBe(4);
  });

  it("abilities have unique ids within each class", () => {
    for (const cls of ["warrior", "rogue", "mage", "tank"] as const) {
      const ids = ABILITIES[cls].map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("warrior has physical and buff abilities", () => {
    const types = ABILITIES.warrior.map((a) => a.type);
    expect(types).toContain("physical");
    expect(types).toContain("buff");
  });

  it("mage has magic abilities", () => {
    const types = ABILITIES.mage.map((a) => a.type);
    expect(types.filter((t) => t === "magic").length).toBeGreaterThan(0);
  });

  it("abilities unlock at levels 5, 10, 15, 20", () => {
    for (const cls of ["warrior", "rogue", "mage", "tank"] as const) {
      const levels = ABILITIES[cls].map((a) => a.unlockLevel).sort((a, b) => a - b);
      expect(levels).toEqual([5, 10, 15, 20]);
    }
  });

  it("all abilities have positive cooldown", () => {
    for (const cls of ["warrior", "rogue", "mage", "tank"] as const) {
      for (const a of ABILITIES[cls]) {
        expect(a.cooldown).toBeGreaterThan(0);
      }
    }
  });
});

describe("getAbilitiesForClass", () => {
  it("returns empty for level 1", () => {
    expect(getAbilitiesForClass("warrior", 1).length).toBe(0);
  });

  it("returns 1 ability at level 5", () => {
    expect(getAbilitiesForClass("warrior", 5).length).toBe(1);
  });

  it("returns all 4 at level 20+", () => {
    expect(getAbilitiesForClass("warrior", 20).length).toBe(4);
    expect(getAbilitiesForClass("rogue", 25).length).toBe(4);
  });

  it("returns abilities up to the given level", () => {
    const abilities = getAbilitiesForClass("mage", 12);
    for (const a of abilities) {
      expect(a.unlockLevel).toBeLessThanOrEqual(12);
    }
  });
});

describe("getAbilityById", () => {
  it("finds ability by id", () => {
    const ability = getAbilityById("warrior", "heavy_strike");
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Heavy Strike");
  });

  it("returns undefined for non-existent id", () => {
    expect(getAbilityById("warrior", "nonexistent")).toBeUndefined();
  });

  it("returns undefined for wrong class", () => {
    expect(getAbilityById("warrior", "fireball")).toBeUndefined();
  });
});
