import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { spendStamina } from "@/lib/game/stamina";
import { STAMINA_COST } from "@/lib/game/balance";
import {
  generateRushMob,
  RUSH_WAVES,
  type DungeonRushState,
} from "@/lib/game/dungeon-rush";

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
    const characterId = body.characterId as string;
    if (!characterId) {
      return NextResponse.json(
        { error: "characterId required" },
        { status: 400 },
      );
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      include: { user: true },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Check for an existing active run
    const existingRun = await prisma.dungeonRun.findFirst({
      where: { characterId },
    });
    if (existingRun) {
      return NextResponse.json(
        { error: "You already have an active run" },
        { status: 400 },
      );
    }

    // Spend stamina
    const cost = STAMINA_COST.DUNGEON_RUSH;
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
        { status: 400 },
      );
    }

    // Generate first wave mob for preview
    const firstMob = generateRushMob(character.level, 1);

    // Create run + spend stamina atomically
    const run = await prisma.$transaction(async (tx) => {
      const created = await tx.dungeonRun.create({
        data: {
          characterId,
          difficulty: "dungeon_rush",
          currentFloor: 1,
          state: {
            runId: "",
            characterId,
            currentWave: 1,
            totalWaves: RUSH_WAVES,
            accumulatedGold: 0,
            accumulatedXp: 0,
          } satisfies DungeonRushState,
        },
      });

      // Patch runId into state
      const state = created.state as unknown as DungeonRushState;
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
      currentWave: 1,
      totalWaves: RUSH_WAVES,
      mob: {
        name: firstMob.name,
        hp: firstMob.maxHp,
        maxHp: firstMob.maxHp,
      },
      staminaCost: cost,
    });
  } catch (error) {
    console.error("[api/dungeon-rush/start POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
