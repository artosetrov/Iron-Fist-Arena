import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { aggregateEquipmentStats } from "@/lib/game/equipment-stats";
import { applyLevelUp } from "@/lib/game/levelUp";
import {
  generateRushMob,
  getRushWaveReward,
  getRushFullClearBonus,
  RUSH_WAVES,
  type DungeonRushState,
} from "@/lib/game/dungeon-rush";
import type { CharacterClass, CharacterOrigin } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const runId = body.runId as string;
    if (!runId) {
      return NextResponse.json({ error: "runId required" }, { status: 400 });
    }

    const run = await prisma.dungeonRun.findFirst({
      where: { id: runId, difficulty: "dungeon_rush" },
      include: {
        character: {
          include: {
            equipment: {
              where: { isEquipped: true },
              include: { item: true },
            },
          },
        },
      },
    });
    if (!run || run.character.userId !== authUser.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const state = run.state as unknown as DungeonRushState;
    const character = run.character;
    const wave = state.currentWave;

    // Generate mob for current wave
    const mobStats = generateRushMob(character.level, wave);

    // Build player combatant
    const playerEqStats = aggregateEquipmentStats(character.equipment ?? []);
    const playerState = buildCombatantState({
      id: character.id,
      name: character.characterName,
      class: character.class as CharacterClass,
      origin: character.origin as CharacterOrigin,
      level: character.level,
      strength: character.strength,
      agility: character.agility,
      vitality: character.vitality,
      endurance: character.endurance,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      luck: character.luck,
      charisma: character.charisma,
      armor: character.armor,
      equipmentBonuses: playerEqStats,
    });

    // Build mob combatant (no abilities, basic attacks only)
    const enemyState = buildCombatantState({
      id: "rush_mob",
      name: mobStats.name,
      class: "warrior",
      level: character.level,
      strength: mobStats.strength,
      agility: mobStats.agility,
      vitality: mobStats.vitality,
      endurance: mobStats.endurance,
      intelligence: mobStats.intelligence,
      wisdom: mobStats.wisdom,
      luck: mobStats.luck,
      charisma: mobStats.charisma,
      armor: mobStats.armor,
    });

    const result = runCombat(playerState, enemyState, []);

    // ─── DEFEAT ─── run ends, accumulated rewards already granted wave-by-wave
    if (result.winnerId !== character.id) {
      await prisma.dungeonRun.delete({ where: { id: runId } });

      return NextResponse.json({
        victory: false,
        wave,
        totalWaves: RUSH_WAVES,
        log: result.log,
        playerSnapshot: result.playerSnapshot,
        enemySnapshot: result.enemySnapshot,
        accumulatedGold: state.accumulatedGold,
        accumulatedXp: state.accumulatedXp,
        message: "Defeat",
      });
    }

    // ─── VICTORY ─── calculate wave reward
    const waveReward = getRushWaveReward(wave);
    const isFullClear = wave >= RUSH_WAVES;
    const fullClearBonus = isFullClear ? getRushFullClearBonus() : 0;

    const goldThisWave = waveReward.gold + fullClearBonus;
    const xpThisWave = waveReward.xp;

    const newAccGold = state.accumulatedGold + goldThisWave;
    const newAccXp = state.accumulatedXp + xpThisWave;

    await prisma.$transaction(async (tx) => {
      // Apply gold/xp + level-up check
      const levelUp = applyLevelUp({
        level: character.level,
        currentXp: character.currentXp + xpThisWave,
        statPointsAvailable: character.statPointsAvailable,
        gold: character.gold + goldThisWave,
        maxHp: character.maxHp,
      });

      await tx.character.update({
        where: { id: character.id },
        data: {
          gold: levelUp.gold,
          currentXp: levelUp.currentXp,
          level: levelUp.level,
          statPointsAvailable: levelUp.statPointsAvailable,
          currentHp: levelUp.currentHp,
        },
      });

      if (isFullClear) {
        // Run complete — delete it
        await tx.dungeonRun.delete({ where: { id: runId } });
      } else {
        // Advance to next wave
        const nextState: DungeonRushState = {
          ...state,
          currentWave: wave + 1,
          accumulatedGold: newAccGold,
          accumulatedXp: newAccXp,
        };
        await tx.dungeonRun.update({
          where: { id: runId },
          data: {
            currentFloor: wave + 1,
            state: nextState as unknown as object,
          },
        });
      }
    });

    return NextResponse.json({
      victory: true,
      wave,
      totalWaves: RUSH_WAVES,
      isFullClear,
      log: result.log,
      playerSnapshot: result.playerSnapshot,
      enemySnapshot: result.enemySnapshot,
      goldEarned: goldThisWave,
      xpEarned: xpThisWave,
      fullClearBonus,
      accumulatedGold: newAccGold,
      accumulatedXp: newAccXp,
      nextWave: isFullClear ? null : wave + 1,
    });
  } catch (error) {
    console.error("[api/dungeon-rush/fight POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
