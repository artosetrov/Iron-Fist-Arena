import { describe, it, expect } from "vitest";
import {
  generateRushMob,
  getRushWaveReward,
  getRushFullClearBonus,
  RUSH_WAVES,
} from "@/lib/game/dungeon-rush";
import {
  RUSH_XP_PER_WAVE,
  RUSH_GOLD_PER_WAVE,
  RUSH_FULL_CLEAR_BONUS,
  BOSS_STAT_MIN,
} from "@/lib/game/balance";

describe("generateRushMob", () => {
  it("returns a mob with all required stat fields", () => {
    const mob = generateRushMob(10, 1);
    expect(mob).toHaveProperty("name");
    expect(mob).toHaveProperty("strength");
    expect(mob).toHaveProperty("agility");
    expect(mob).toHaveProperty("vitality");
    expect(mob).toHaveProperty("endurance");
    expect(mob).toHaveProperty("intelligence");
    expect(mob).toHaveProperty("wisdom");
    expect(mob).toHaveProperty("luck");
    expect(mob).toHaveProperty("charisma");
    expect(mob).toHaveProperty("armor");
    expect(mob).toHaveProperty("maxHp");
  });

  it("all stats are at least BOSS_STAT_MIN", () => {
    const mob = generateRushMob(1, 1);
    expect(mob.strength).toBeGreaterThanOrEqual(BOSS_STAT_MIN);
    expect(mob.agility).toBeGreaterThanOrEqual(BOSS_STAT_MIN);
    expect(mob.vitality).toBeGreaterThanOrEqual(BOSS_STAT_MIN);
    expect(mob.endurance).toBeGreaterThanOrEqual(BOSS_STAT_MIN);
    expect(mob.intelligence).toBeGreaterThanOrEqual(BOSS_STAT_MIN);
    expect(mob.wisdom).toBeGreaterThanOrEqual(BOSS_STAT_MIN);
  });

  it("maxHp is at least 100", () => {
    const mob = generateRushMob(1, 1);
    expect(mob.maxHp).toBeGreaterThanOrEqual(100);
  });

  it("higher waves produce stronger mobs", () => {
    const wave1 = generateRushMob(10, 1);
    const wave5 = generateRushMob(10, 5);
    expect(wave5.strength).toBeGreaterThanOrEqual(wave1.strength);
    expect(wave5.vitality).toBeGreaterThanOrEqual(wave1.vitality);
  });

  it("higher level produces stronger mobs", () => {
    const low = generateRushMob(5, 1);
    const high = generateRushMob(50, 1);
    expect(high.strength).toBeGreaterThan(low.strength);
    expect(high.maxHp).toBeGreaterThan(low.maxHp);
  });

  it("mob name comes from pool (is a string)", () => {
    const mob = generateRushMob(10, 1);
    expect(typeof mob.name).toBe("string");
    expect(mob.name.length).toBeGreaterThan(0);
  });

  it("luck and charisma are fixed at 5", () => {
    const mob = generateRushMob(50, 3);
    expect(mob.luck).toBe(5);
    expect(mob.charisma).toBe(5);
  });
});

describe("getRushWaveReward", () => {
  it("wave 1 returns base rewards", () => {
    const r = getRushWaveReward(1);
    expect(r.xp).toBe(RUSH_XP_PER_WAVE);
    expect(r.gold).toBe(RUSH_GOLD_PER_WAVE);
  });

  it("rewards scale linearly with wave number", () => {
    const r3 = getRushWaveReward(3);
    expect(r3.xp).toBe(RUSH_XP_PER_WAVE * 3);
    expect(r3.gold).toBe(RUSH_GOLD_PER_WAVE * 3);
  });

  it("wave 5 rewards are 5x base", () => {
    const r5 = getRushWaveReward(5);
    expect(r5.xp).toBe(RUSH_XP_PER_WAVE * 5);
    expect(r5.gold).toBe(RUSH_GOLD_PER_WAVE * 5);
  });
});

describe("getRushFullClearBonus", () => {
  it("returns the configured bonus", () => {
    expect(getRushFullClearBonus()).toBe(RUSH_FULL_CLEAR_BONUS);
  });
});

describe("constants", () => {
  it("RUSH_WAVES is 5", () => {
    expect(RUSH_WAVES).toBe(5);
  });
});
