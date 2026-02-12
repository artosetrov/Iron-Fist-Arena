import { describe, it, expect } from "vitest";
import { checkLevelUp, applyLevelUp } from "@/lib/game/levelUp";
import { xpForLevel } from "@/lib/game/progression";

describe("checkLevelUp", () => {
  it("does not level up when XP is insufficient", () => {
    const result = checkLevelUp({ level: 1, currentXp: 0 });
    expect(result.newLevel).toBe(1);
    expect(result.statPointsGained).toBe(0);
    expect(result.goldGained).toBe(0);
  });

  it("levels up when XP meets threshold", () => {
    const needed = xpForLevel(1);
    const result = checkLevelUp({ level: 1, currentXp: needed });
    expect(result.newLevel).toBe(2);
    expect(result.statPointsGained).toBe(5);
    expect(result.goldGained).toBe(200); // 100 * 2
  });

  it("handles multiple level ups", () => {
    const result = checkLevelUp({ level: 1, currentXp: 999999 });
    expect(result.newLevel).toBeGreaterThan(5);
    expect(result.statPointsGained).toBe(result.newLevel * 5 - 5); // 5 per level gained
  });

  it("gives skill points every 5 levels", () => {
    // Start at level 4, gain enough XP to hit level 5
    const needed = xpForLevel(4);
    const result = checkLevelUp({ level: 4, currentXp: needed });
    expect(result.newLevel).toBe(5);
    expect(result.skillPointsGained).toBe(1);
  });

  it("carries over remaining XP", () => {
    const needed = xpForLevel(1);
    const extra = 50;
    const result = checkLevelUp({ level: 1, currentXp: needed + extra });
    expect(result.newCurrentXp).toBe(extra);
  });

  it("gives 5 stat points per level gained", () => {
    const needed = xpForLevel(1);
    const result = checkLevelUp({ level: 1, currentXp: needed });
    expect(result.statPointsGained).toBe(5);
  });
});

describe("applyLevelUp", () => {
  it("returns updated character stats after level up", () => {
    const needed = xpForLevel(1);
    const result = applyLevelUp({
      level: 1,
      currentXp: needed,
      statPointsAvailable: 0,
      gold: 100,
      maxHp: 100,
    });
    expect(result.level).toBe(2);
    expect(result.statPointsAvailable).toBe(5);
    expect(result.gold).toBe(100 + 200); // 100 existing + 100*2 from levelup
    expect(result.currentHp).toBe(100); // full heal
  });

  it("does not modify stats when no level up", () => {
    const result = applyLevelUp({
      level: 1,
      currentXp: 0,
      statPointsAvailable: 10,
      gold: 500,
      maxHp: 200,
    });
    expect(result.level).toBe(1);
    expect(result.statPointsAvailable).toBe(10);
    expect(result.gold).toBe(500);
    expect(result.currentHp).toBe(200);
  });
});
