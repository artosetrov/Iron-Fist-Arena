import { describe, it, expect } from "vitest";
import {
  getBossStats,
  isDungeonUnlocked,
  buildDungeonListWithProgress,
  getBossGoldReward,
  getBossXpReward,
  getDungeonCompletionBonus,
  DUNGEONS,
  BOSSES_PER_DUNGEON,
  type DungeonProgressRecord,
} from "@/lib/game/dungeon";

describe("getBossStats", () => {
  const sampleBoss = DUNGEONS[0].bosses[0];

  it("returns valid stats with positive values", () => {
    const stats = getBossStats(10, sampleBoss);
    expect(stats.strength).toBeGreaterThanOrEqual(10);
    expect(stats.vitality).toBeGreaterThanOrEqual(10);
    expect(stats.maxHp).toBeGreaterThanOrEqual(100);
    expect(stats.armor).toBeGreaterThanOrEqual(0);
    expect(stats.name).toBe(sampleBoss.name);
  });

  it("higher player level produces higher stats", () => {
    const low = getBossStats(5, sampleBoss);
    const high = getBossStats(30, sampleBoss);
    expect(high.strength).toBeGreaterThan(low.strength);
    expect(high.vitality).toBeGreaterThan(low.vitality);
    expect(high.maxHp).toBeGreaterThan(low.maxHp);
  });

  it("later bosses have higher multipliers and stronger stats", () => {
    const firstBoss = DUNGEONS[0].bosses[0];
    const lastBoss = DUNGEONS[0].bosses[DUNGEONS[0].bosses.length - 1];
    const first = getBossStats(10, firstBoss);
    const last = getBossStats(10, lastBoss);
    expect(last.strength).toBeGreaterThan(first.strength);
  });
});

describe("isDungeonUnlocked", () => {
  it("first dungeon is always unlocked at sufficient level", () => {
    const progressMap = new Map<string, DungeonProgressRecord>();
    const result = isDungeonUnlocked(DUNGEONS[0], DUNGEONS[0].minLevel, progressMap);
    expect(result).toBe(true);
  });

  it("first dungeon is locked if player level is too low", () => {
    const progressMap = new Map<string, DungeonProgressRecord>();
    const result = isDungeonUnlocked(DUNGEONS[0], 0, progressMap);
    expect(result).toBe(false);
  });

  it("second dungeon requires first to be completed", () => {
    if (DUNGEONS.length < 2) return;
    const progressMap = new Map<string, DungeonProgressRecord>();
    const unlocked = isDungeonUnlocked(DUNGEONS[1], 100, progressMap);
    expect(unlocked).toBe(false);

    progressMap.set(DUNGEONS[0].id, {
      dungeonId: DUNGEONS[0].id,
      bossIndex: BOSSES_PER_DUNGEON,
      completed: true,
    });
    const unlockedAfter = isDungeonUnlocked(DUNGEONS[1], 100, progressMap);
    expect(unlockedAfter).toBe(true);
  });
});

describe("buildDungeonListWithProgress", () => {
  it("returns all dungeons with unlock and progress state", () => {
    const list = buildDungeonListWithProgress(100, []);
    expect(list.length).toBe(DUNGEONS.length);
    expect(list[0].unlocked).toBe(true);
    expect(list[0].bossIndex).toBe(0);
    expect(list[0].completed).toBe(false);
  });

  it("marks dungeons as completed when all bosses beaten", () => {
    const progress: DungeonProgressRecord[] = [
      { dungeonId: DUNGEONS[0].id, bossIndex: BOSSES_PER_DUNGEON, completed: true },
    ];
    const list = buildDungeonListWithProgress(100, progress);
    expect(list[0].completed).toBe(true);
  });
});

describe("reward formulas", () => {
  it("getBossGoldReward scales with dungeon and boss index", () => {
    const early = getBossGoldReward(0, 0);
    const late = getBossGoldReward(2, 5);
    expect(late).toBeGreaterThan(early);
    expect(early).toBeGreaterThan(0);
  });

  it("getBossXpReward scales with dungeon and boss index", () => {
    const early = getBossXpReward(0, 0);
    const late = getBossXpReward(2, 5);
    expect(late).toBeGreaterThan(early);
    expect(early).toBeGreaterThan(0);
  });

  it("getDungeonCompletionBonus gives gold and xp", () => {
    const bonus = getDungeonCompletionBonus(0);
    expect(bonus.gold).toBeGreaterThan(0);
    expect(bonus.xp).toBeGreaterThan(0);
  });

  it("later dungeons give bigger completion bonuses", () => {
    const first = getDungeonCompletionBonus(0);
    const third = getDungeonCompletionBonus(2);
    expect(third.gold).toBeGreaterThan(first.gold);
    expect(third.xp).toBeGreaterThan(first.xp);
  });
});
