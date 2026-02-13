import { describe, it, expect } from "vitest";
import { aggregateEquipmentStats, aggregateArmor } from "@/lib/game/equipment-stats";
import { WEAPON_AFFINITY_BONUS } from "@/lib/game/weapon-affinity";

const makeItem = (
  stats: Record<string, number>,
  overrides?: { equippedSlot?: string; itemType?: string; description?: string; itemName?: string; catalogId?: string | null },
) => ({
  equippedSlot: overrides?.equippedSlot ?? "chest",
  item: {
    baseStats: stats,
    itemType: overrides?.itemType ?? "chest",
    catalogId: overrides?.catalogId ?? null,
    description: overrides?.description ?? null,
    itemName: overrides?.itemName ?? "Test Item",
  },
  upgradeLevel: 0,
});

describe("aggregateEquipmentStats", () => {
  it("returns zeroes for empty array", () => {
    const result = aggregateEquipmentStats([]);
    expect(result).toEqual({ ATK: 0, DEF: 0, HP: 0, CRIT: 0, SPEED: 0, ARMOR: 0 });
  });

  it("sums stats from multiple items", () => {
    const items = [
      makeItem({ ATK: 10, DEF: 5 }),
      makeItem({ ATK: 20, DEF: 10, HP: 50 }),
    ];
    const result = aggregateEquipmentStats(items);
    expect(result.ATK).toBe(30);
    expect(result.DEF).toBe(15);
    expect(result.HP).toBe(50);
  });

  it("handles items with null baseStats", () => {
    const items = [
      { equippedSlot: "chest", item: { baseStats: null, itemType: "chest" }, upgradeLevel: 0 },
      makeItem({ ATK: 10 }),
    ];
    const result = aggregateEquipmentStats(items);
    expect(result.ATK).toBe(10);
  });

  it("applies weapon affinity bonus to weapon slot with matching class", () => {
    const weapon = makeItem(
      { ATK: 100, CRIT: 10 },
      { equippedSlot: "weapon", itemType: "weapon", itemName: "Iron Sword" },
    );
    const withAffinity = aggregateEquipmentStats([weapon], "warrior");
    const withoutAffinity = aggregateEquipmentStats([weapon]);
    // warrior + sword = affinity, so +15% bonus
    expect(withAffinity.ATK).toBe(Math.floor(100 * (1 + WEAPON_AFFINITY_BONUS)));
    expect(withoutAffinity.ATK).toBe(100);
  });

  it("does not apply affinity bonus to non-weapon slots", () => {
    const armor = makeItem(
      { DEF: 50 },
      { equippedSlot: "chest", itemType: "chest", itemName: "Iron Chestplate" },
    );
    const result = aggregateEquipmentStats([armor], "warrior");
    expect(result.DEF).toBe(50);
  });

  it("does not apply affinity bonus when class does not match weapon", () => {
    const weapon = makeItem(
      { ATK: 100 },
      { equippedSlot: "weapon", itemType: "weapon", itemName: "Iron Staff" },
    );
    // warrior's affinity is sword, not staff
    const result = aggregateEquipmentStats([weapon], "warrior");
    expect(result.ATK).toBe(100);
  });
});

describe("aggregateArmor", () => {
  it("extracts armor from aggregated stats", () => {
    const items = [
      makeItem({ ARMOR: 20 }),
      makeItem({ ARMOR: 30 }),
    ];
    expect(aggregateArmor(items)).toBe(50);
  });

  it("returns 0 for no armor items", () => {
    const items = [makeItem({ ATK: 10 })];
    expect(aggregateArmor(items)).toBe(0);
  });
});
