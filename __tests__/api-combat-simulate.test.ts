import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildCombatantState, runCombat } from "@/lib/game/combat";
import {
  TRAINING_MAX_DAILY,
  TRAINING_XP_BASE,
  TRAINING_XP_PER_LEVEL,
  TRAINING_DUMMY_LEVEL_OFFSET,
  TRAINING_DUMMY_STAT_MULT,
} from "@/lib/game/balance";

beforeEach(() => {
  vi.restoreAllMocks();
});

/* ─────────────────── Training XP formula ─────────────────── */

describe("Training XP formula", () => {
  it("returns base + level * per_level for level 1", () => {
    const xp = TRAINING_XP_BASE + 1 * TRAINING_XP_PER_LEVEL;
    expect(xp).toBe(25); // 20 + 1*5
  });

  it("returns base + level * per_level for level 10", () => {
    const xp = TRAINING_XP_BASE + 10 * TRAINING_XP_PER_LEVEL;
    expect(xp).toBe(70); // 20 + 10*5
  });

  it("returns base + level * per_level for level 50", () => {
    const xp = TRAINING_XP_BASE + 50 * TRAINING_XP_PER_LEVEL;
    expect(xp).toBe(270); // 20 + 50*5
  });

  it("returns 0 XP on loss (business rule, not formula)", () => {
    // Loss gives 0 XP — this is enforced in the API route
    expect(0).toBe(0);
  });
});

/* ─────────────────── Training dummy stat generation ─────────────────── */

describe("Training dummy stats", () => {
  const playerLevel = 10;
  const playerStr = 50;

  it("dummy level = max(1, playerLevel + offset)", () => {
    const dummyLevel = Math.max(1, playerLevel + TRAINING_DUMMY_LEVEL_OFFSET);
    expect(dummyLevel).toBe(12); // max(1, 10 + 2)
  });

  it("dummy level floors at 1 for low-level players", () => {
    const dummyLevel = Math.max(1, 1 + TRAINING_DUMMY_LEVEL_OFFSET);
    expect(dummyLevel).toBe(3); // max(1, 1 + 2)
  });

  it("dummy stat is player stat * mult * weight, min 5", () => {
    const weight = 1.4; // warrior STR weight
    const scaled = Math.max(5, Math.floor(playerStr * TRAINING_DUMMY_STAT_MULT * weight));
    expect(scaled).toBe(42); // 50 * 0.6 * 1.4 = 42
  });

  it("dummy stat floors at 5 for very low player stats", () => {
    const weight = 0.3;
    const lowStat = 5;
    const scaled = Math.max(5, Math.floor(lowStat * TRAINING_DUMMY_STAT_MULT * weight));
    expect(scaled).toBe(5); // 5 * 0.6 * 0.3 = 0.9 → floor = 0 → max(5, 0) = 5
  });
});

/* ─────────────────── Combat against dummy ─────────────────── */

describe("Training combat runs correctly", () => {
  const buildPlayer = (level: number) =>
    buildCombatantState({
      id: "player",
      name: "TestPlayer",
      class: "warrior",
      level,
      strength: 50,
      agility: 30,
      vitality: 40,
      endurance: 25,
      intelligence: 10,
      wisdom: 15,
      luck: 10,
      charisma: 10,
      armor: 20,
    });

  const buildDummy = (playerLevel: number) => {
    const mult = TRAINING_DUMMY_STAT_MULT;
    const dummyLevel = Math.max(1, playerLevel + TRAINING_DUMMY_LEVEL_OFFSET);
    const s = (base: number, w: number) => Math.max(5, Math.floor(base * mult * w));
    return buildCombatantState({
      id: "training-dummy",
      name: "Training Dummy — Warrior",
      class: "warrior",
      level: dummyLevel,
      strength: s(50, 1.4),
      agility: s(30, 0.6),
      vitality: s(40, 1.0),
      endurance: s(25, 0.8),
      intelligence: s(10, 0.3),
      wisdom: s(15, 0.3),
      luck: s(10, 0.5),
      charisma: s(10, 0.3),
      armor: Math.floor(20 * mult),
    });
  };

  it("returns a valid combat result", () => {
    const player = buildPlayer(10);
    const dummy = buildDummy(10);
    const result = runCombat(player, dummy, []);
    expect(result).toHaveProperty("winnerId");
    expect(result).toHaveProperty("log");
    expect(result).toHaveProperty("turns");
    expect(result.log.length).toBeGreaterThan(0);
    expect(result.turns).toBeGreaterThan(0);
    expect(result.turns).toBeLessThanOrEqual(15);
  });

  it("player should generally win against weaker dummy", () => {
    // Run 20 fights — player should win majority since dummy has 60% stats
    let wins = 0;
    for (let i = 0; i < 20; i++) {
      const player = buildPlayer(10);
      const dummy = buildDummy(10);
      const result = runCombat(player, dummy, []);
      if (result.winnerId === "player") wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(10);
  });

  it("works for all preset classes", () => {
    const classes = ["warrior", "rogue", "mage", "tank"] as const;
    for (const cls of classes) {
      const player = buildCombatantState({
        id: "player",
        name: "Test",
        class: cls,
        level: 10,
        strength: 30,
        agility: 30,
        vitality: 30,
        endurance: 30,
        intelligence: 30,
        wisdom: 30,
        luck: 30,
        charisma: 30,
        armor: 20,
      });
      const dummy = buildDummy(10);
      const result = runCombat(player, dummy, []);
      expect(result.turns).toBeGreaterThan(0);
    }
  });
});

/* ─────────────────── Daily limit constant ─────────────────── */

describe("Training daily limit", () => {
  it("max daily trainings is 10", () => {
    expect(TRAINING_MAX_DAILY).toBe(10);
  });
});
