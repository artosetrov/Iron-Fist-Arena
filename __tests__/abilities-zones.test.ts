import { describe, it, expect } from "vitest";
import { ABILITIES, getAbilitiesForClass } from "@/lib/game/abilities";

describe("abilities — zone modifiers", () => {
  it("Whirlwind has aoeZones: true", () => {
    const whirlwind = ABILITIES.warrior.find((a) => a.id === "whirlwind");
    expect(whirlwind).toBeDefined();
    expect(whirlwind!.aoeZones).toBe(true);
  });

  it("Titan's Slam has targetZone: head", () => {
    const titanSlam = ABILITIES.warrior.find((a) => a.id === "titan_slam");
    expect(titanSlam).toBeDefined();
    expect(titanSlam!.targetZone).toBe("head");
  });

  it("Backstab has targetZone: waist and ignoresBlock: true", () => {
    const backstab = ABILITIES.rogue.find((a) => a.id === "backstab");
    expect(backstab).toBeDefined();
    expect(backstab!.targetZone).toBe("waist");
    expect(backstab!.ignoresBlock).toBe(true);
  });

  it("Shield Bash has targetZone: head", () => {
    const shieldBash = ABILITIES.tank.find((a) => a.id === "shield_bash");
    expect(shieldBash).toBeDefined();
    expect(shieldBash!.targetZone).toBe("head");
  });

  it("Mage abilities have no zone modifiers", () => {
    for (const ability of ABILITIES.mage) {
      expect(ability.targetZone).toBeUndefined();
      expect(ability.ignoresBlock).toBeUndefined();
      expect(ability.aoeZones).toBeUndefined();
    }
  });

  it("Quick Strike has no zone modifiers (uses stance)", () => {
    const qs = ABILITIES.rogue.find((a) => a.id === "quick_strike");
    expect(qs).toBeDefined();
    expect(qs!.targetZone).toBeUndefined();
    expect(qs!.ignoresBlock).toBeUndefined();
    expect(qs!.aoeZones).toBeUndefined();
  });

  it("Battle Cry (buff) has no zone modifiers", () => {
    const bc = ABILITIES.warrior.find((a) => a.id === "battle_cry");
    expect(bc).toBeDefined();
    expect(bc!.targetZone).toBeUndefined();
  });

  it("AbilityDef type supports zone fields", () => {
    // Verify all abilities are well-formed
    for (const cls of Object.keys(ABILITIES) as (keyof typeof ABILITIES)[]) {
      for (const ability of ABILITIES[cls]) {
        expect(ability.id).toBeTruthy();
        expect(ability.name).toBeTruthy();
        expect(typeof ability.cooldown).toBe("number");
        // Zone fields are optional
        if (ability.targetZone !== undefined) {
          expect(typeof ability.targetZone).toBe("string");
        }
        if (ability.ignoresBlock !== undefined) {
          expect(typeof ability.ignoresBlock).toBe("boolean");
        }
        if (ability.aoeZones !== undefined) {
          expect(typeof ability.aoeZones).toBe("boolean");
        }
      }
    }
  });
});
