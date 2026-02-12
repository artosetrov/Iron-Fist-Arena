import { describe, it, expect, vi, afterEach } from "vitest";
import { rollRarity, rollDropChance } from "@/lib/game/loot";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rollRarity", () => {
  it("returns a valid rarity", () => {
    const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];
    for (let i = 0; i < 100; i++) {
      const rarity = rollRarity(10, "normal");
      expect(validRarities).toContain(rarity);
    }
  });

  it("returns common for low rolls", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // roll = 1
    const rarity = rollRarity(0, "easy"); // enhanced = 1 + 0 + 0 = 1
    expect(rarity).toBe("common");
  });

  it("returns legendary for very high enhanced rolls", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999); // roll ~1000
    const rarity = rollRarity(100, "hard"); // enhanced = 1000 + 200 + 120 = 1200 (capped)
    expect(rarity).toBe("legendary");
  });

  it("higher luck increases rarity", () => {
    // Run multiple times and count rares+
    let highLuckRares = 0;
    let lowLuckRares = 0;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const r1 = rollRarity(100, "normal");
      if (r1 !== "common" && r1 !== "uncommon") highLuckRares++;
      const r2 = rollRarity(0, "normal");
      if (r2 !== "common" && r2 !== "uncommon") lowLuckRares++;
    }

    expect(highLuckRares).toBeGreaterThan(lowLuckRares);
  });

  it("hard difficulty gives bonus", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.85); // roll ~851
    const easy = rollRarity(10, "easy"); // enhanced = 851 + 20 + 0 = 871
    const hard = rollRarity(10, "hard"); // enhanced = 851 + 20 + 120 = 991
    // Easy should be uncommon/rare, hard should be legendary
    expect(["uncommon", "rare", "common"]).toContain(easy);
    expect(hard).toBe("legendary");
  });
});

describe("rollDropChance", () => {
  it("boss always drops", () => {
    for (let i = 0; i < 100; i++) {
      expect(rollDropChance("normal", true)).toBe(true);
    }
  });

  it("returns boolean", () => {
    const result = rollDropChance("normal", false);
    expect(typeof result).toBe("boolean");
  });

  it("easy has 60% chance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.59);
    expect(rollDropChance("easy", false)).toBe(true);
    vi.spyOn(Math, "random").mockReturnValue(0.61);
    expect(rollDropChance("easy", false)).toBe(false);
  });

  it("normal has 50% chance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.49);
    expect(rollDropChance("normal", false)).toBe(true);
    vi.spyOn(Math, "random").mockReturnValue(0.51);
    expect(rollDropChance("normal", false)).toBe(false);
  });

  it("hard has 70% chance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.69);
    expect(rollDropChance("hard", false)).toBe(true);
    vi.spyOn(Math, "random").mockReturnValue(0.71);
    expect(rollDropChance("hard", false)).toBe(false);
  });
});
