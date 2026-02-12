import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { TRAINING_MAX_DAILY } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

/** Get start of today (UTC) */
const startOfTodayUTC = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      select: { id: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const todayStart = startOfTodayUTC();
    const todayCount = await prisma.trainingSession.count({
      where: { characterId: character.id, playedAt: { gte: todayStart } },
    });

    return NextResponse.json({
      used: todayCount,
      remaining: Math.max(0, TRAINING_MAX_DAILY - todayCount),
      max: TRAINING_MAX_DAILY,
    });
  } catch (error) {
    console.error("[api/combat/status GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
