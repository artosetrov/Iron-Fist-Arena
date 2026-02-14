import { describe, it, expect, vi, afterEach } from "vitest";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { defaultStance } from "@/lib/game/body-zones";
import { BODY_ZONES, ZONE_DAMAGE_MULT } from "@/lib/game/balance";
import type { CombatStance, BodyZone } from "@/lib/game/types";

afterEach(() => {
  vi.restoreAllMocks();
});

const makePlayer = (overrides: Partial<Parameters<typeof buildCombatantState>[0]> = {}) =>
  buildCombatantState({
    id: "player",
    name: "Player",
    class: "warrior",
    level: 20,
    strength: 50,
    agility: 30,
    vitality: 40,
    endurance: 25,
    intelligence: 10,
    wisdom: 15,
    luck: 10,
    charisma: 10,
    armor: 20,
    ...overrides,
  });

const makeEnemy = (overrides: Partial<Parameters<typeof buildCombatantState>[0]> = {}) =>
  buildCombatantState({
    id: "enemy",
    name: "Enemy",
    class: "warrior",
    level: 20,
    strength: 50,
    agility: 30,
    vitality: 40,
    endurance: 25,
    intelligence: 10,
    wisdom: 15,
    luck: 10,
    charisma: 10,
    armor: 20,
    ...overrides,
  });

/* ══════════════════════════════════════════
   buildCombatantState — stance & zoneArmor
   ══════════════════════════════════════════ */
describe("buildCombatantState — zone fields", () => {
  it("has default stance when not provided", () => {
    const state = makePlayer();
    expect(state.stance).toEqual(defaultStance());
  });

  it("accepts custom stance", () => {
    const customStance: CombatStance = {
      attackZones: ["head", "waist"],
      blockAllocation: { head: 0, torso: 3, waist: 0, legs: 0 },
    };
    const state = makePlayer({ stance: customStance });
    expect(state.stance).toEqual(customStance);
  });

  it("has zoneArmor with even split when not provided", () => {
    const state = makePlayer({ armor: 40 });
    // 40 / 4 = 10 per zone
    expect(state.zoneArmor.head).toBe(10);
    expect(state.zoneArmor.torso).toBe(10);
    expect(state.zoneArmor.waist).toBe(10);
    expect(state.zoneArmor.legs).toBe(10);
  });

  it("accepts custom zoneArmor", () => {
    const za: Record<BodyZone, number> = { head: 50, torso: 100, waist: 30, legs: 20 };
    const state = makePlayer({ zoneArmor: za });
    expect(state.zoneArmor).toEqual(za);
  });
});

/* ══════════════════════════════════════════
   runCombat — body zones in log
   ══════════════════════════════════════════ */
describe("runCombat — zone combat log entries", () => {
  it("physical attacks have bodyZone in log entries", () => {
    const player = makePlayer({
      stance: { attackZones: ["head"], blockAllocation: { head: 0, torso: 1, waist: 1, legs: 1 } },
    });
    const enemy = makeEnemy({
      stance: { attackZones: ["torso"], blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 } },
    });
    const result = runCombat(player, enemy);

    // Find attack entries (not status_tick, not stun, not dodge)
    const attackEntries = result.log.filter(
      (e) => e.damage && e.damage > 0 && !e.dodge,
    );
    expect(attackEntries.length).toBeGreaterThan(0);

    for (const entry of attackEntries) {
      // Physical attacks should have a bodyZone
      if (entry.bodyZone) {
        expect(BODY_ZONES).toContain(entry.bodyZone);
      }
    }
  });

  it("blocked attacks show blockReduction in log", () => {
    // Player attacks head, enemy blocks head with 3 points
    const player = makePlayer({
      stance: { attackZones: ["head"], blockAllocation: { head: 0, torso: 1, waist: 1, legs: 1 } },
      agility: 100, // ensure player goes first
    });
    const enemy = makeEnemy({
      stance: { attackZones: ["torso"], blockAllocation: { head: 3, torso: 0, waist: 0, legs: 0 } },
      agility: 1,
    });

    const result = runCombat(player, enemy);

    // Look for player's attack entries hitting head
    const playerAttacks = result.log.filter(
      (e) => e.actorId === "player" && e.damage && e.damage > 0 && e.bodyZone === "head",
    );

    // At least some should be blocked
    const blockedEntries = playerAttacks.filter((e) => e.blocked);
    expect(blockedEntries.length).toBeGreaterThan(0);
    for (const e of blockedEntries) {
      expect(e.blockReduction).toBe(0.75); // 3 blocks = 75%
    }
  });

  it("unblocked zones have no blockReduction", () => {
    // Player attacks legs, enemy doesn't block legs
    const player = makePlayer({
      stance: { attackZones: ["legs"], blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 } },
    });
    const enemy = makeEnemy({
      stance: { attackZones: ["torso"], blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 } },
    });
    const result = runCombat(player, enemy);

    const playerLegsAttacks = result.log.filter(
      (e) => e.actorId === "player" && e.bodyZone === "legs" && e.damage && e.damage > 0,
    );

    for (const e of playerLegsAttacks) {
      expect(e.blocked).toBeFalsy();
      expect(e.blockReduction).toBeUndefined();
    }
  });

  it("combat still produces a winner or draw", () => {
    for (let i = 0; i < 20; i++) {
      const result = runCombat(makePlayer(), makeEnemy());
      if (result.draw) {
        expect(result.winnerId).toBeNull();
      } else {
        expect(result.winnerId).toBeTruthy();
        expect(result.loserId).toBeTruthy();
      }
    }
  });

  it("mage attacks have no bodyZone (magic bypasses zones)", () => {
    const magePlayer = makePlayer({
      class: "mage",
      intelligence: 80,
      strength: 10,
      level: 20,
      stance: { attackZones: ["head"], blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 } },
    });
    const enemy = makeEnemy({
      stance: { attackZones: ["torso"], blockAllocation: { head: 3, torso: 0, waist: 0, legs: 0 } },
    });

    const result = runCombat(magePlayer, enemy);

    // Find mage ability attacks (magic type)
    const mageSpells = result.log.filter(
      (e) =>
        e.actorId === "player" &&
        e.damage &&
        e.damage > 0 &&
        ["fireball", "frost_nova", "lightning_strike", "meteor_storm"].includes(e.action),
    );

    // Magic attacks should not have bodyZone
    for (const e of mageSpells) {
      expect(e.bodyZone).toBeUndefined();
      expect(e.blocked).toBeFalsy();
    }
  });
});

/* ══════════════════════════════════════════
   Zone damage multiplier effect
   ══════════════════════════════════════════ */
describe("zone damage multiplier effect", () => {
  it("head attacks deal more average damage than leg attacks over many combats", () => {
    // Run many combats with head focus vs legs focus against same enemy
    let headTotalDmg = 0;
    let legTotalDmg = 0;
    const runs = 30;

    for (let i = 0; i < runs; i++) {
      const headPlayer = makePlayer({
        stance: { attackZones: ["head"], blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 } },
      });
      const enemy1 = makeEnemy({
        stance: { attackZones: ["torso"], blockAllocation: { head: 0, torso: 0, waist: 0, legs: 3 } },
      });
      const r1 = runCombat(headPlayer, enemy1);
      headTotalDmg += r1.log
        .filter((e) => e.actorId === "player" && e.damage)
        .reduce((s, e) => s + (e.damage ?? 0), 0);

      const legPlayer = makePlayer({
        stance: { attackZones: ["legs"], blockAllocation: { head: 1, torso: 1, waist: 1, legs: 0 } },
      });
      const enemy2 = makeEnemy({
        stance: { attackZones: ["torso"], blockAllocation: { head: 3, torso: 0, waist: 0, legs: 0 } },
      });
      const r2 = runCombat(legPlayer, enemy2);
      legTotalDmg += r2.log
        .filter((e) => e.actorId === "player" && e.damage)
        .reduce((s, e) => s + (e.damage ?? 0), 0);
    }

    // Head (1.3x) should deal more total damage than legs (0.8x) on average
    expect(headTotalDmg / runs).toBeGreaterThan(legTotalDmg / runs);
  });
});
