import { describe, it, expect } from "vitest";
import {
  getWeaponCategory,
  hasWeaponAffinity,
  CLASS_WEAPON_AFFINITY,
  WEAPON_AFFINITY_BONUS,
} from "@/lib/game/weapon-affinity";

describe("getWeaponCategory", () => {
  it("returns null for non-weapon items", () => {
    expect(getWeaponCategory({ itemName: "Iron Chestplate", itemType: "chest" })).toBeNull();
  });

  it("detects sword from item name", () => {
    expect(getWeaponCategory({ itemName: "Rusted Sword" })).toBe("sword");
    expect(getWeaponCategory({ itemName: "Shadow Blade" })).toBe("sword");
    expect(getWeaponCategory({ itemName: "Crimson Saber" })).toBe("sword");
  });

  it("detects dagger from item name", () => {
    expect(getWeaponCategory({ itemName: "Iron Dagger" })).toBe("dagger");
    expect(getWeaponCategory({ itemName: "Bone Knife" })).toBe("dagger");
    expect(getWeaponCategory({ itemName: "Rat Fang" })).toBe("dagger");
  });

  it("detects mace from item name", () => {
    expect(getWeaponCategory({ itemName: "War Hammer" })).toBe("mace");
    expect(getWeaponCategory({ itemName: "Iron Mace" })).toBe("mace");
    expect(getWeaponCategory({ itemName: "Stone Crusher" })).toBe("mace");
  });

  it("detects staff from item name", () => {
    expect(getWeaponCategory({ itemName: "Oak Staff" })).toBe("staff");
    expect(getWeaponCategory({ itemName: "Crystal Rod" })).toBe("staff");
    expect(getWeaponCategory({ itemName: "Ancient Scepter" })).toBe("staff");
  });

  it("detects category from description field", () => {
    expect(getWeaponCategory({ description: "Sword" })).toBe("sword");
    expect(getWeaponCategory({ description: "Dagger" })).toBe("dagger");
    expect(getWeaponCategory({ description: "Mace" })).toBe("mace");
    expect(getWeaponCategory({ description: "Staff" })).toBe("staff");
  });

  it("returns null for unknown weapon names", () => {
    expect(getWeaponCategory({ itemName: "Mysterious Orb" })).toBeNull();
  });
});

describe("hasWeaponAffinity", () => {
  it("warrior has affinity with sword", () => {
    expect(hasWeaponAffinity("warrior", "sword")).toBe(true);
  });

  it("rogue has affinity with dagger", () => {
    expect(hasWeaponAffinity("rogue", "dagger")).toBe(true);
  });

  it("tank has affinity with mace", () => {
    expect(hasWeaponAffinity("tank", "mace")).toBe(true);
  });

  it("mage has affinity with staff", () => {
    expect(hasWeaponAffinity("mage", "staff")).toBe(true);
  });

  it("warrior does NOT have affinity with dagger", () => {
    expect(hasWeaponAffinity("warrior", "dagger")).toBe(false);
  });

  it("unknown class has no affinity", () => {
    expect(hasWeaponAffinity("paladin", "sword")).toBe(false);
  });
});

describe("constants", () => {
  it("WEAPON_AFFINITY_BONUS is 0.15 (15%)", () => {
    expect(WEAPON_AFFINITY_BONUS).toBe(0.15);
  });

  it("all four classes have affinity mappings", () => {
    expect(Object.keys(CLASS_WEAPON_AFFINITY).sort()).toEqual(["mage", "rogue", "tank", "warrior"]);
  });
});
