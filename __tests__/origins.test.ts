import { describe, it, expect, vi } from "vitest";
import {
  applyOriginBonuses,
  hasCheatDeath,
  getCheatDeathChance,
  ORIGIN_DEFS,
  ALL_ORIGINS,
  ORIGIN_CHANGE_COST,
  type CharacterOrigin,
} from "@/lib/game/origins";
import type { BaseStats } from "@/lib/game/types";

const BASE_STATS: BaseStats = {
  strength: 100,
  agility: 100,
  vitality: 100,
  endurance: 100,
  intelligence: 100,
  wisdom: 100,
  luck: 100,
  charisma: 100,
};

describe("applyOriginBonuses", () => {
  it("human: +5% to all stats", () => {
    const result = applyOriginBonuses(BASE_STATS, "human");
    expect(result.strength).toBe(105);
    expect(result.agility).toBe(105);
    expect(result.vitality).toBe(105);
    expect(result.endurance).toBe(105);
    expect(result.intelligence).toBe(105);
    expect(result.wisdom).toBe(105);
    expect(result.luck).toBe(105);
    expect(result.charisma).toBe(105);
  });

  it("orc: +8% STR, -3% END", () => {
    const result = applyOriginBonuses(BASE_STATS, "orc");
    expect(result.strength).toBe(108);
    expect(result.endurance).toBe(97);
    // Other stats unchanged
    expect(result.agility).toBe(100);
    expect(result.vitality).toBe(100);
  });

  it("skeleton: +6% AGI, +4% LCK", () => {
    const result = applyOriginBonuses(BASE_STATS, "skeleton");
    expect(result.agility).toBe(106);
    expect(result.luck).toBe(104);
    expect(result.strength).toBe(100);
  });

  it("demon: +8% END, +5% VIT", () => {
    const result = applyOriginBonuses(BASE_STATS, "demon");
    expect(result.endurance).toBe(108);
    expect(result.vitality).toBe(105);
    expect(result.strength).toBe(100);
  });

  it("dogfolk: no stat bonuses", () => {
    const result = applyOriginBonuses(BASE_STATS, "dogfolk");
    expect(result.strength).toBe(100);
    expect(result.agility).toBe(100);
    expect(result.vitality).toBe(100);
    expect(result.endurance).toBe(100);
    expect(result.intelligence).toBe(100);
    expect(result.wisdom).toBe(100);
    expect(result.luck).toBe(100);
    expect(result.charisma).toBe(100);
  });

  it("floors values (no fractions)", () => {
    const oddStats: BaseStats = {
      strength: 33,
      agility: 33,
      vitality: 33,
      endurance: 33,
      intelligence: 33,
      wisdom: 33,
      luck: 33,
      charisma: 33,
    };
    const result = applyOriginBonuses(oddStats, "human");
    // 33 * 1.05 = 34.65, floor => 34
    expect(result.strength).toBe(34);
  });

  it("no origin bonus exceeds 8% per stat for any origin", () => {
    for (const origin of ALL_ORIGINS) {
      const mods = ORIGIN_DEFS[origin].statModifiers;
      for (const [, value] of Object.entries(mods)) {
        expect(Math.abs(value)).toBeLessThanOrEqual(0.08);
      }
    }
  });
});

describe("hasCheatDeath", () => {
  it("returns true for dogfolk", () => {
    expect(hasCheatDeath("dogfolk")).toBe(true);
  });

  it("returns false for other origins", () => {
    expect(hasCheatDeath("human")).toBe(false);
    expect(hasCheatDeath("orc")).toBe(false);
    expect(hasCheatDeath("skeleton")).toBe(false);
    expect(hasCheatDeath("demon")).toBe(false);
  });
});

describe("getCheatDeathChance", () => {
  it("returns 0.05 (5%) for dogfolk", () => {
    expect(getCheatDeathChance("dogfolk")).toBe(0.05);
  });

  it("returns 0 for other origins", () => {
    expect(getCheatDeathChance("human")).toBe(0);
    expect(getCheatDeathChance("orc")).toBe(0);
  });
});

describe("cheating_death combat integration", () => {
  it("buildCombatantState sets origin on CombatantState", async () => {
    const { buildCombatantState } = await import("@/lib/game/combat");

    const state = buildCombatantState({
      id: "test",
      name: "Test",
      class: "warrior",
      origin: "dogfolk",
      level: 1,
      strength: 10,
      agility: 10,
      vitality: 10,
      endurance: 10,
      intelligence: 10,
      wisdom: 10,
      luck: 10,
      charisma: 10,
    });

    expect(state.origin).toBe("dogfolk");
  });

  it("origin bonuses are applied in buildCombatantState", async () => {
    const { buildCombatantState } = await import("@/lib/game/combat");

    const withOrigin = buildCombatantState({
      id: "test",
      name: "Test",
      class: "warrior",
      origin: "orc",
      level: 1,
      strength: 100,
      agility: 100,
      vitality: 100,
      endurance: 100,
      intelligence: 100,
      wisdom: 100,
      luck: 100,
      charisma: 100,
    });

    const withoutOrigin = buildCombatantState({
      id: "test2",
      name: "Test2",
      class: "warrior",
      level: 1,
      strength: 100,
      agility: 100,
      vitality: 100,
      endurance: 100,
      intelligence: 100,
      wisdom: 100,
      luck: 100,
      charisma: 100,
    });

    // orc: +8% STR, -3% END
    expect(withOrigin.baseStats.strength).toBe(108);
    expect(withOrigin.baseStats.endurance).toBe(97);
    expect(withoutOrigin.baseStats.strength).toBe(100);
    expect(withoutOrigin.baseStats.endurance).toBe(100);
  });

  it("dogfolk cheating_death triggers on lethal damage (mocked RNG)", async () => {
    let cheatDeathOccurred = false;

    const { buildCombatantState, runCombat } = await import("@/lib/game/combat");

    for (let i = 0; i < 200; i++) {
      const player = buildCombatantState({
        id: "player",
        name: "Player",
        class: "warrior",
        origin: "dogfolk",
        level: 1,
        strength: 10,
        agility: 10,
        vitality: 10,
        endurance: 10,
        intelligence: 10,
        wisdom: 10,
        luck: 10,
        charisma: 10,
      });
      player.currentHp = 2;

      const enemy = buildCombatantState({
        id: "enemy",
        name: "Enemy",
        class: "warrior",
        level: 50,
        strength: 500,
        agility: 500,
        vitality: 500,
        endurance: 10,
        intelligence: 10,
        wisdom: 10,
        luck: 10,
        charisma: 10,
      });

      const result = runCombat(player, enemy, ["basic"]);
      if (result.log.some((e) => e.message.includes("cheated death"))) {
        cheatDeathOccurred = true;
        break;
      }
    }

    // With 200 rounds and 5% chance, probability of at least one trigger ≈ 1 - 0.95^200 ≈ 99.997%
    expect(cheatDeathOccurred).toBe(true);
  });
});

describe("ORIGIN_CHANGE_COST", () => {
  it("equals 500 gold", () => {
    expect(ORIGIN_CHANGE_COST).toBe(500);
  });
});

describe("ALL_ORIGINS completeness", () => {
  it("has 5 origins", () => {
    expect(ALL_ORIGINS).toHaveLength(5);
  });

  it("every origin has a definition", () => {
    for (const origin of ALL_ORIGINS) {
      const def = ORIGIN_DEFS[origin];
      expect(def).toBeDefined();
      expect(def.label).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.bonusDescription).toBeTruthy();
    }
  });
});
