import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  TRAINING_EXTRA_SESSIONS,
  TRAINING_EXTRA_COST_GEMS,
  TRAINING_EXTRA_MAX_BUYS,
  TRAINING_MAX_DAILY,
} from "@/lib/game/balance";
import { checkRateLimit } from "@/lib/rate-limit";
import { startOfTodayUTC } from "@/lib/game/date-utils";

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

    const rl = checkRateLimit(authUser.id, {
      prefix: "training-buy-extra",
      windowMs: 10_000,
      maxRequests: 5,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const todayStart = startOfTodayUTC();

    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: authUser.id },
        select: {
          id: true,
          bonusTrainings: true,
          bonusTrainingsDate: true,
          bonusTrainingsBuys: true,
          user: { select: { id: true, gems: true } },
        },
      });
      if (!character || !character.user) {
        return { error: "Character not found", status: 404 } as const;
      }

      /* Reset if new day */
      const isToday =
        character.bonusTrainingsDate &&
        character.bonusTrainingsDate.getTime() === todayStart.getTime();
      const currentBuys = isToday ? character.bonusTrainingsBuys : 0;
      const currentBonus = isToday ? character.bonusTrainings : 0;

      if (currentBuys >= TRAINING_EXTRA_MAX_BUYS) {
        return { error: "Maximum daily purchases reached", status: 400 } as const;
      }

      if (character.user.gems < TRAINING_EXTRA_COST_GEMS) {
        return { error: "Not enough gems", status: 400 } as const;
      }

      /* Deduct gems */
      await tx.user.update({
        where: { id: character.user.id },
        data: { gems: { decrement: TRAINING_EXTRA_COST_GEMS } },
      });

      /* Add bonus trainings */
      const newBonus = currentBonus + TRAINING_EXTRA_SESSIONS;
      const newBuys = currentBuys + 1;

      await tx.character.update({
        where: { id: character.id },
        data: {
          bonusTrainings: newBonus,
          bonusTrainingsBuys: newBuys,
          bonusTrainingsDate: todayStart,
        },
      });

      /* Recalculate status */
      const todayCount = await tx.trainingSession.count({
        where: { characterId: character.id, playedAt: { gte: todayStart } },
      });

      const totalMax = TRAINING_MAX_DAILY + newBonus;

      return {
        ok: true,
        gemsSpent: TRAINING_EXTRA_COST_GEMS,
        gemsRemaining: character.user.gems - TRAINING_EXTRA_COST_GEMS,
        status: {
          used: todayCount,
          remaining: Math.max(0, totalMax - todayCount),
          max: totalMax,
          baseMax: TRAINING_MAX_DAILY,
          bonus: newBonus,
          buys: newBuys,
          maxBuys: TRAINING_EXTRA_MAX_BUYS,
          buyCostGems: TRAINING_EXTRA_COST_GEMS,
        },
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status as number },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/combat/buy-extra POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
