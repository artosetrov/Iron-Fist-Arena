import { describe, it, expect, vi, afterEach } from "vitest";
import {
  computeCurrentStamina,
  spendStamina,
  getMaxStamina,
  applyRegen,
  STAMINA_REGEN_MINUTES,
  MAX_STAMINA_BASE,
  MAX_STAMINA_VIP_BONUS,
  OVERFLOW_CAP,
  STAMINA_COST,
} from "@/lib/game/stamina";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getMaxStamina", () => {
  it("returns 100 for non-VIP", () => {
    expect(getMaxStamina(false)).toBe(MAX_STAMINA_BASE);
  });

  it("returns 120 for VIP", () => {
    expect(getMaxStamina(true)).toBe(MAX_STAMINA_BASE + MAX_STAMINA_VIP_BONUS);
  });
});

describe("computeCurrentStamina", () => {
  it("returns current stamina when already at cap", () => {
    const result = computeCurrentStamina({
      currentStamina: 100,
      maxStamina: 100,
      lastStaminaUpdate: new Date(),
    });
    expect(result).toBe(100);
  });

  it("regenerates 1 point per 12 minutes", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const twelveMinAgo = new Date(now - STAMINA_REGEN_MINUTES * 60 * 1000);
    const result = computeCurrentStamina({
      currentStamina: 50,
      maxStamina: 100,
      lastStaminaUpdate: twelveMinAgo,
    });
    expect(result).toBe(51);
  });

  it("does not exceed max stamina", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const result = computeCurrentStamina({
      currentStamina: 99,
      maxStamina: 100,
      lastStaminaUpdate: hourAgo,
    });
    expect(result).toBeLessThanOrEqual(100);
  });

  it("caps overflow at OVERFLOW_CAP", () => {
    const result = computeCurrentStamina({
      currentStamina: 250,
      maxStamina: 100,
      lastStaminaUpdate: new Date(),
    });
    expect(result).toBe(OVERFLOW_CAP);
  });
});

describe("spendStamina", () => {
  it("returns new stamina after spending", () => {
    const result = spendStamina({
      currentStamina: 50,
      maxStamina: 100,
      lastStaminaUpdate: new Date(),
      cost: STAMINA_COST.PVP,
    });
    expect("newStamina" in result).toBe(true);
    if ("newStamina" in result) {
      expect(result.newStamina).toBe(40);
    }
  });

  it("returns error when not enough stamina", () => {
    const result = spendStamina({
      currentStamina: 5,
      maxStamina: 100,
      lastStaminaUpdate: new Date(),
      cost: STAMINA_COST.PVP,
    });
    expect("error" in result).toBe(true);
  });

  it("considers regen when checking stamina", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    // 5 stamina + 5 regen (60 min / 12 = 5) = 10, enough for PVP
    const result = spendStamina({
      currentStamina: 5,
      maxStamina: 100,
      lastStaminaUpdate: new Date(now - 60 * 60 * 1000),
      cost: STAMINA_COST.PVP,
    });
    expect("newStamina" in result).toBe(true);
  });

  it("costs match GDD values", () => {
    expect(STAMINA_COST.PVP).toBe(10);
    expect(STAMINA_COST.DUNGEON_EASY).toBe(15);
    expect(STAMINA_COST.DUNGEON_NORMAL).toBe(20);
    expect(STAMINA_COST.DUNGEON_HARD).toBe(25);
    expect(STAMINA_COST.BOSS_RAID).toBe(40);
  });
});

describe("applyRegen", () => {
  it("regenerates stamina", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const result = applyRegen({
      currentStamina: 50,
      maxStamina: 100,
      lastStaminaUpdate: new Date(now - 24 * 60 * 1000), // 24 min = 2 regen
      isVip: false,
    });
    expect(result.currentStamina).toBe(52);
  });

  it("does not exceed cap", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const result = applyRegen({
      currentStamina: 99,
      maxStamina: 100,
      lastStaminaUpdate: new Date(now - 60 * 60 * 1000),
      isVip: false,
    });
    expect(result.currentStamina).toBeLessThanOrEqual(100);
  });

  it("pauses natural regen when over cap", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const result = applyRegen({
      currentStamina: 150,
      maxStamina: 100,
      lastStaminaUpdate: new Date(now - 60 * 60 * 1000),
      isVip: false,
    });
    expect(result.currentStamina).toBe(150); // No regen, stays at 150
  });
});
