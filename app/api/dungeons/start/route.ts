import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { spendStamina } from "@/lib/game/stamina";
import { getDungeonById, getBossStats } from "@/lib/game/dungeon";

export const dynamic = "force-dynamic";

/** State stored in dungeon_runs.state JSON */
export type DungeonRunState = {
  runId: string;
  characterId: string;
  dungeonId: string;
  bossIndex: number;
  bossName: string;
  bossMaxHp: number;
  bossCurrentHp: number;
  bossStats: ReturnType<typeof getBossStats>;
  rewards: { gold: number; xp: number };
};

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
    const characterId = body.characterId as string;
    const dungeonId = body.dungeonId as string;
    if (!characterId || !dungeonId) {
      return NextResponse.json(
        { error: "characterId and dungeonId required" },
        { status: 400 }
      );
    }

    const dungeon = getDungeonById(dungeonId);
    if (!dungeon) {
      return NextResponse.json(
        { error: "Dungeon not found" },
        { status: 404 }
      );
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      include: { user: true },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // Check level requirement
    if (character.level < dungeon.minLevel) {
      return NextResponse.json(
        { error: `Requires level ${dungeon.minLevel}` },
        { status: 400 }
      );
    }

    // Check if there's already an active run
    const existingRun = await prisma.dungeonRun.findFirst({
      where: { characterId },
    });
    if (existingRun) {
      return NextResponse.json(
        { error: "You already have an active dungeon run" },
        { status: 400 }
      );
    }

    // Check unlock: previous dungeon must be completed
    if (dungeon.prevDungeonId) {
      const prevProgress = await prisma.dungeonProgress.findUnique({
        where: {
          characterId_dungeonId: {
            characterId,
            dungeonId: dungeon.prevDungeonId,
          },
        },
      });
      if (!prevProgress?.completed) {
        return NextResponse.json(
          { error: "Previous dungeon not completed" },
          { status: 400 }
        );
      }
    }

    // Get current boss index from progress
    const progress = await prisma.dungeonProgress.findUnique({
      where: {
        characterId_dungeonId: { characterId, dungeonId },
      },
    });

    const bossIndex = progress?.bossIndex ?? 0;
    if (bossIndex >= dungeon.bosses.length) {
      return NextResponse.json(
        { error: "Dungeon already completed" },
        { status: 400 }
      );
    }

    const boss = dungeon.bosses[bossIndex];
    const bossStats = getBossStats(character.level, boss);

    // Spend stamina
    const cost = dungeon.staminaCost;
    const staminaResult = spendStamina({
      currentStamina: character.currentStamina,
      maxStamina: character.maxStamina,
      lastStaminaUpdate: character.lastStaminaUpdate,
      cost,
      isVip:
        !!character.user?.premiumUntil &&
        character.user.premiumUntil > new Date(),
    });
    if ("error" in staminaResult) {
      return NextResponse.json(
        { error: staminaResult.error },
        { status: 400 }
      );
    }

    // Create run + spend stamina atomically
    const run = await prisma.$transaction(async (tx) => {
      const created = await tx.dungeonRun.create({
        data: {
          characterId,
          difficulty: dungeonId, // store dungeonId here
          currentFloor: bossIndex + 1,
          state: {
            runId: "",
            characterId,
            dungeonId,
            bossIndex,
            bossName: boss.name,
            bossMaxHp: bossStats.maxHp,
            bossCurrentHp: bossStats.maxHp,
            bossStats,
            rewards: { gold: 0, xp: 0 },
          } satisfies Omit<DungeonRunState, "runId"> & { runId: string },
        },
      });

      // Patch runId into state
      const state = created.state as unknown as DungeonRunState;
      state.runId = created.id;
      await tx.dungeonRun.update({
        where: { id: created.id },
        data: { state: state as unknown as object },
      });

      await tx.character.update({
        where: { id: characterId },
        data: {
          currentStamina: staminaResult.newStamina,
          lastStaminaUpdate: staminaResult.newLastUpdate,
        },
      });

      return created;
    });

    return NextResponse.json({
      runId: run.id,
      dungeonId,
      dungeonName: dungeon.name,
      bossIndex,
      totalBosses: dungeon.bosses.length,
      boss: {
        name: boss.name,
        description: boss.description,
        hp: bossStats.maxHp,
        maxHp: bossStats.maxHp,
      },
      staminaCost: cost,
    });
  } catch (error) {
    console.error("[api/dungeons/start POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
