import { describe, it, expect, vi, afterEach } from "vitest";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { MAX_TURNS } from "@/lib/game/constants";

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

describe("runCombat", () => {
  it("returns a valid CombatResult", () => {
    const result = runCombat(makePlayer(), makeEnemy());
    expect(result).toHaveProperty("winnerId");
    expect(result).toHaveProperty("loserId");
    expect(result).toHaveProperty("draw");
    expect(result).toHaveProperty("turns");
    expect(result).toHaveProperty("log");
    expect(result).toHaveProperty("playerSnapshot");
    expect(result).toHaveProperty("enemySnapshot");
  });

  it("always has a winner or draw", () => {
    for (let i = 0; i < 20; i++) {
      const result = runCombat(makePlayer(), makeEnemy());
      if (result.draw) {
        expect(result.winnerId).toBeNull();
        expect(result.loserId).toBeNull();
      } else {
        expect(result.winnerId).toBeTruthy();
        expect(result.loserId).toBeTruthy();
        expect(result.winnerId).not.toBe(result.loserId);
      }
    }
  });

  it("does not exceed MAX_TURNS", () => {
    for (let i = 0; i < 20; i++) {
      const result = runCombat(makePlayer(), makeEnemy());
      expect(result.turns).toBeLessThanOrEqual(MAX_TURNS);
    }
  });

  it("log entries have correct structure", () => {
    const result = runCombat(makePlayer(), makeEnemy());
    expect(result.log.length).toBeGreaterThan(0);
    for (const entry of result.log) {
      expect(entry).toHaveProperty("turn");
      expect(entry).toHaveProperty("actorId");
      expect(entry).toHaveProperty("targetId");
      expect(entry).toHaveProperty("action");
      expect(entry).toHaveProperty("message");
    }
  });

  it("winner has HP > 0 (unless draw)", () => {
    for (let i = 0; i < 20; i++) {
      const player = makePlayer();
      const enemy = makeEnemy();
      const result = runCombat(player, enemy);
      if (!result.draw) {
        const winner = result.winnerId === "player" ? player : enemy;
        const loser = result.winnerId === "player" ? enemy : player;
        expect(winner.currentHp).toBeGreaterThan(0);
        // Loser may have 0 HP or less HP% than winner
      }
    }
  });

  it("snapshots capture final state", () => {
    const player = makePlayer();
    const enemy = makeEnemy();
    const result = runCombat(player, enemy);
    expect(result.playerSnapshot.id).toBe("player");
    expect(result.enemySnapshot.id).toBe("enemy");
    expect(result.playerSnapshot.currentHp).toBeLessThanOrEqual(result.playerSnapshot.maxHp);
  });

  it("stronger player wins more often", () => {
    let strongWins = 0;
    for (let i = 0; i < 50; i++) {
      const player = makePlayer({ strength: 200, vitality: 100 });
      const enemy = makeEnemy({ strength: 20, vitality: 20 });
      const result = runCombat(player, enemy);
      if (result.winnerId === "player") strongWins++;
    }
    expect(strongWins).toBeGreaterThan(35); // Should win vast majority
  });

  it("higher agility goes first", () => {
    const player = makePlayer({ agility: 100 });
    const enemy = makeEnemy({ agility: 10 });
    const result = runCombat(player, enemy);
    // First non-status action should be from player
    const firstAction = result.log.find(
      (e) => e.action !== "status_tick" && e.action !== "stun"
    );
    expect(firstAction?.actorId).toBe("player");
  });

  it("buff abilities do NOT deal damage", () => {
    // Warrior with battle_cry (buff), force using it
    const player = makePlayer({ level: 20, class: "warrior" });
    const enemy = makeEnemy();
    const result = runCombat(player, enemy, ["battle_cry"]);

    // Find the battle_cry log entry
    const buffEntry = result.log.find((e) => e.action === "battle_cry");
    if (buffEntry) {
      // Buff should not deal damage
      expect(buffEntry.damage).toBeUndefined();
    }
  });

  it("firstStrikeOnly ability only works once", () => {
    const player = makePlayer({ level: 20, class: "rogue", agility: 100 });
    const enemy = makeEnemy({ agility: 10, vitality: 200 }); // High HP to survive
    // Force backstab twice via choices: first should work, second should revert to basic
    const result = runCombat(player, enemy, ["backstab", "backstab"]);

    // Find all player actions (excluding status ticks/stuns)
    const playerActions = result.log.filter(
      (e) => e.actorId === "player" && e.action !== "status_tick" && e.action !== "stun"
    );

    // First player action should be backstab (first strike)
    if (playerActions.length > 0) {
      expect(playerActions[0].action).toBe("backstab");
    }

    // Second explicit player action from choices should be basic (firstStrikeOnly reverted)
    if (playerActions.length > 1) {
      expect(playerActions[1].action).toBe("basic");
    }
  });
});

describe("buildCombatantState", () => {
  it("creates valid combatant", () => {
    const state = buildCombatantState({
      id: "test",
      name: "Test",
      class: "warrior",
      level: 10,
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
    expect(state.id).toBe("test");
    expect(state.currentHp).toBe(state.maxHp);
    expect(state.maxHp).toBe(400); // 40 * 10
    expect(state.statusEffects).toEqual([]);
    expect(state.abilityCooldowns).toEqual({});
  });

  it("computes derived stats", () => {
    const state = buildCombatantState({
      id: "test",
      name: "Test",
      class: "mage",
      level: 10,
      strength: 10,
      agility: 30,
      vitality: 35,
      endurance: 15,
      intelligence: 80,
      wisdom: 50,
      luck: 20,
      charisma: 10,
    });
    expect(state.derived.critChance).toBeGreaterThan(5);
    expect(state.derived.dodgeChance).toBeGreaterThan(3);
    expect(state.derived.magicResist).toBeGreaterThan(0);
  });
});
