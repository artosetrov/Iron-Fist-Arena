import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { DungeonRushState } from "@/lib/game/dungeon-rush";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const characterId = request.nextUrl.searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json(
        { error: "characterId required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    const activeRun = await prisma.dungeonRun.findFirst({
      where: { characterId, difficulty: "dungeon_rush" },
    });

    if (!activeRun) {
      return NextResponse.json({ activeRun: null });
    }

    const state = activeRun.state as unknown as DungeonRushState;

    return NextResponse.json({
      activeRun: {
        runId: activeRun.id,
        currentWave: state.currentWave,
        totalWaves: state.totalWaves,
        accumulatedGold: state.accumulatedGold,
        accumulatedXp: state.accumulatedXp,
      },
    });
  } catch (error) {
    console.error("[api/dungeon-rush/status GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
