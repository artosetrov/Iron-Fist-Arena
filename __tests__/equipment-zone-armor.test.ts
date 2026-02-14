import { describe, it, expect } from "vitest";
import { aggregateZoneArmor } from "@/lib/game/equipment-stats";

const makeItem = (
  slot: string,
  stats: Record<string, number>,
) => ({
  equippedSlot: slot,
  item: {
    baseStats: stats,
    itemType: slot,
    catalogId: null,
    description: null,
    itemName: "Test Item",
  },
  upgradeLevel: 0,
});

describe("aggregateZoneArmor", () => {
  it("returns zeroes for empty array", () => {
    const result = aggregateZoneArmor([]);
    expect(result).toEqual({ head: 0, torso: 0, waist: 0, legs: 0 });
  });

  it("maps helmet ARMOR to head zone", () => {
    const result = aggregateZoneArmor([makeItem("helmet", { ARMOR: 50 })]);
    expect(result.head).toBe(50);
    expect(result.torso).toBe(0);
    expect(result.waist).toBe(0);
    expect(result.legs).toBe(0);
  });

  it("maps chest ARMOR to torso zone", () => {
    const result = aggregateZoneArmor([makeItem("chest", { ARMOR: 120 })]);
    expect(result.torso).toBe(120);
  });

  it("maps gloves ARMOR to torso zone", () => {
    const result = aggregateZoneArmor([makeItem("gloves", { ARMOR: 30 })]);
    expect(result.torso).toBe(30);
  });

  it("maps belt ARMOR to waist zone", () => {
    const result = aggregateZoneArmor([makeItem("belt", { ARMOR: 25 })]);
    expect(result.waist).toBe(25);
  });

  it("maps boots and legs ARMOR to legs zone", () => {
    const result = aggregateZoneArmor([
      makeItem("boots", { ARMOR: 15 }),
      makeItem("legs", { ARMOR: 20 }),
    ]);
    expect(result.legs).toBe(35);
  });

  it("splits weapon ARMOR evenly across all 4 zones", () => {
    const result = aggregateZoneArmor([makeItem("weapon", { ARMOR: 40 })]);
    expect(result.head).toBe(10);
    expect(result.torso).toBe(10);
    expect(result.waist).toBe(10);
    expect(result.legs).toBe(10);
  });

  it("splits accessory ARMOR evenly", () => {
    const result = aggregateZoneArmor([makeItem("accessory", { ARMOR: 20 })]);
    expect(result.head).toBe(5);
    expect(result.torso).toBe(5);
    expect(result.waist).toBe(5);
    expect(result.legs).toBe(5);
  });

  it("combines zone-specific and shared armor", () => {
    const result = aggregateZoneArmor([
      makeItem("helmet", { ARMOR: 40 }),
      makeItem("chest", { ARMOR: 100 }),
      makeItem("belt", { ARMOR: 20 }),
      makeItem("boots", { ARMOR: 30 }),
      makeItem("weapon", { ARMOR: 8 }), // 2 per zone
      makeItem("ring", { ARMOR: 12 }),   // 3 per zone (shared total 20 / 4 = 5)
    ]);
    expect(result.head).toBe(40 + 5);  // helmet + shared
    expect(result.torso).toBe(100 + 5);
    expect(result.waist).toBe(20 + 5);
    expect(result.legs).toBe(30 + 5);
  });

  it("ignores items without ARMOR stat", () => {
    const result = aggregateZoneArmor([
      makeItem("helmet", { ATK: 10, DEF: 5 }),
      makeItem("chest", { HP: 50 }),
    ]);
    expect(result).toEqual({ head: 0, torso: 0, waist: 0, legs: 0 });
  });

  it("handles lowercase armor key", () => {
    const result = aggregateZoneArmor([makeItem("helmet", { armor: 35 })]);
    expect(result.head).toBe(35);
  });

  it("full equipment set produces correct zone armor", () => {
    const items = [
      makeItem("helmet", { ARMOR: 50 }),
      makeItem("chest", { ARMOR: 120 }),
      makeItem("gloves", { ARMOR: 30 }),
      makeItem("legs", { ARMOR: 40 }),
      makeItem("boots", { ARMOR: 25 }),
      makeItem("belt", { ARMOR: 15 }),
      makeItem("weapon", { ARMOR: 0 }),
      makeItem("accessory", { ARMOR: 0 }),
    ];
    const result = aggregateZoneArmor(items);
    expect(result.head).toBe(50);
    expect(result.torso).toBe(150); // chest 120 + gloves 30
    expect(result.waist).toBe(15);
    expect(result.legs).toBe(65);  // legs 40 + boots 25
  });
});
