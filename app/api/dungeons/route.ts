import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  buildDungeonListWithProgress,
  type DungeonProgressRecord,
} from "@/lib/game/dungeon";

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
        { status: 400 }
      );
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const progressRows = await prisma.dungeonProgress.findMany({
      where: { characterId },
    });

    const progressRecords: DungeonProgressRecord[] = progressRows.map((r) => ({
      dungeonId: r.dungeonId,
      bossIndex: r.bossIndex,
      completed: r.completed,
    }));

    const dungeons = buildDungeonListWithProgress(
      character.level,
      progressRecords
    );

    // Check for active dungeon run
    const activeRun = await prisma.dungeonRun.findFirst({
      where: { characterId },
    });

    return NextResponse.json({
      dungeons,
      activeRun: activeRun
        ? {
            runId: activeRun.id,
            dungeonId: activeRun.difficulty, // we store dungeonId in difficulty field
            state: activeRun.state,
          }
        : null,
    });
  } catch (error) {
    console.error("[api/dungeons GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
