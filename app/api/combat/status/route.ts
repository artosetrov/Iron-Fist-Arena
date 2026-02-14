import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  TRAINING_MAX_DAILY,
  TRAINING_EXTRA_COST_GEMS,
  TRAINING_EXTRA_MAX_BUYS,
} from "@/lib/game/balance";

import { startOfTodayUTC } from "@/lib/game/date-utils";

export const dynamic = "force-dynamic";

/** Get bonus trainings for today (auto-resets if date mismatch) */
const getBonusForToday = (character: {
  bonusTrainings: number;
  bonusTrainingsDate: Date | null;
  bonusTrainingsBuys: number;
}) => {
  const todayStart = startOfTodayUTC();
  if (
    !character.bonusTrainingsDate ||
    character.bonusTrainingsDate.getTime() !== todayStart.getTime()
  ) {
    return { bonus: 0, buys: 0 };
  }
  return { bonus: character.bonusTrainings, buys: character.bonusTrainingsBuys };
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
      select: {
        id: true,
        bonusTrainings: true,
        bonusTrainingsDate: true,
        bonusTrainingsBuys: true,
      },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const todayStart = startOfTodayUTC();
    const todayCount = await prisma.trainingSession.count({
      where: { characterId: character.id, playedAt: { gte: todayStart } },
    });

    const { bonus, buys } = getBonusForToday(character);
    const totalMax = TRAINING_MAX_DAILY + bonus;

    return NextResponse.json({
      used: todayCount,
      remaining: Math.max(0, totalMax - todayCount),
      max: totalMax,
      baseMax: TRAINING_MAX_DAILY,
      bonus,
      buys,
      maxBuys: TRAINING_EXTRA_MAX_BUYS,
      buyCostGems: TRAINING_EXTRA_COST_GEMS,
    });
  } catch (error) {
    console.error("[api/combat/status GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
