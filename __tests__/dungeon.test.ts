import { describe, it, expect } from "vitest";
import {
  generateFloorRooms,
  getEnemyStatsForRoom,
  type RoomType,
} from "@/lib/game/dungeon";

describe("generateFloorRooms", () => {
  it("always ends with boss room", () => {
    for (let floor = 1; floor <= 5; floor++) {
      const rooms = generateFloorRooms(floor, 12345);
      expect(rooms[rooms.length - 1]).toBe("boss");
    }
  });

  it("generates correct number of rooms (5 + floor * 2)", () => {
    for (let floor = 1; floor <= 5; floor++) {
      const rooms = generateFloorRooms(floor, 42);
      expect(rooms.length).toBe(5 + floor * 2);
    }
  });

  it("only contains valid room types", () => {
    const validTypes: RoomType[] = ["combat", "treasure", "elite", "trap", "rest", "boss"];
    const rooms = generateFloorRooms(3, 777);
    for (const room of rooms) {
      expect(validTypes).toContain(room);
    }
  });

  it("is deterministic with same seed", () => {
    const rooms1 = generateFloorRooms(2, 12345);
    const rooms2 = generateFloorRooms(2, 12345);
    expect(rooms1).toEqual(rooms2);
  });

  it("produces different rooms with different seeds", () => {
    const rooms1 = generateFloorRooms(2, 11111);
    const rooms2 = generateFloorRooms(2, 99999);
    // Very unlikely to be exactly the same
    const same = rooms1.every((r, i) => r === rooms2[i]);
    expect(same).toBe(false);
  });
});

describe("getEnemyStatsForRoom", () => {
  it("returns valid enemy stats", () => {
    const stats = getEnemyStatsForRoom(10, 1, "normal", "combat");
    expect(stats.strength).toBeGreaterThanOrEqual(10);
    expect(stats.vitality).toBeGreaterThanOrEqual(10);
    expect(stats.maxHp).toBeGreaterThanOrEqual(100);
    expect(stats.name).toBe("Enemy");
    expect(stats.isBoss).toBe(false);
  });

  it("boss has higher stats", () => {
    const normal = getEnemyStatsForRoom(10, 1, "normal", "combat");
    const boss = getEnemyStatsForRoom(10, 1, "normal", "boss");
    expect(boss.strength).toBeGreaterThan(normal.strength);
    expect(boss.vitality).toBeGreaterThan(normal.vitality);
    expect(boss.maxHp).toBeGreaterThan(normal.maxHp);
    expect(boss.isBoss).toBe(true);
  });

  it("elite is marked as boss", () => {
    const elite = getEnemyStatsForRoom(10, 1, "normal", "elite");
    expect(elite.isBoss).toBe(true);
    expect(elite.name).toBe("Elite Enemy");
  });

  it("hard difficulty increases stats", () => {
    const easy = getEnemyStatsForRoom(10, 1, "easy", "combat");
    const hard = getEnemyStatsForRoom(10, 1, "hard", "combat");
    expect(hard.strength).toBeGreaterThan(easy.strength);
    expect(hard.maxHp).toBeGreaterThan(easy.maxHp);
  });

  it("higher floors increase stats", () => {
    const floor1 = getEnemyStatsForRoom(10, 1, "normal", "combat");
    const floor5 = getEnemyStatsForRoom(10, 5, "normal", "combat");
    expect(floor5.strength).toBeGreaterThan(floor1.strength);
  });

  it("higher player level increases stats", () => {
    const low = getEnemyStatsForRoom(5, 1, "normal", "combat");
    const high = getEnemyStatsForRoom(30, 1, "normal", "combat");
    expect(high.strength).toBeGreaterThan(low.strength);
  });

  it("boss name includes floor number", () => {
    const boss = getEnemyStatsForRoom(10, 3, "normal", "boss");
    expect(boss.name).toContain("3");
  });
});
