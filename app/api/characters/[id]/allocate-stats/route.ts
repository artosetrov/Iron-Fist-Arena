import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { goldCostForStatTraining } from "@/lib/game/stat-training";
import { getMaxHp } from "@/lib/game/stats";
import { NextResponse } from "next/server";
import { STAT_SOFT_CAP, STAT_HARD_CAP, type StatKey } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

/**
 * GDD §3.2 — Stat allocation (free stat points from level-ups)
 * + Gold training: buy +1 stat for gold (exponential cost curve)
 */

const VALID_STATS = Object.keys(STAT_SOFT_CAP) as StatKey[];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { stat, mode } = body as { stat: string; mode: "points" | "gold" };

    if (!stat || !(VALID_STATS as readonly string[]).includes(stat)) {
      return NextResponse.json(
        { error: `Invalid stat. Must be one of: ${VALID_STATS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!mode || !["points", "gold"].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "points" or "gold"' },
        { status: 400 }
      );
    }

    const statKey = stat as StatKey;

    const character = await prisma.character.findFirst({
      where: { id, userId: authUser.id },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const currentValue = character[statKey];

    // Hard cap check
    if (currentValue >= STAT_HARD_CAP) {
      return NextResponse.json(
        { error: `${statKey} is already at hard cap (${STAT_HARD_CAP})` },
        { status: 400 }
      );
    }

    // Soft cap warning (allow exceeding via gold, but warn)
    const softCap = STAT_SOFT_CAP[statKey];

    // If vitality changes, recalculate maxHp
    const derivedUpdates =
      statKey === "vitality"
        ? { maxHp: getMaxHp(currentValue + 1) }
        : {};

    if (mode === "points") {
      if (character.statPointsAvailable <= 0) {
        return NextResponse.json(
          { error: "No stat points available" },
          { status: 400 }
        );
      }

      const updated = await prisma.character.update({
        where: { id: character.id },
        data: {
          [statKey]: currentValue + 1,
          statPointsAvailable: character.statPointsAvailable - 1,
          ...derivedUpdates,
        },
      });

      return NextResponse.json({
        success: true,
        stat: statKey,
        newValue: updated[statKey],
        statPointsAvailable: updated.statPointsAvailable,
        gold: updated.gold,
        mode: "points",
      });
    }

    // mode === "gold"
    const cost = goldCostForStatTraining(currentValue);

    if (character.gold < cost) {
      return NextResponse.json(
        {
          error: `Not enough gold. Need ${cost}, have ${character.gold}`,
          cost,
          gold: character.gold,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        [statKey]: currentValue + 1,
        gold: character.gold - cost,
        ...derivedUpdates,
      },
    });

    return NextResponse.json({
      success: true,
      stat: statKey,
      newValue: updated[statKey],
      statPointsAvailable: updated.statPointsAvailable,
      gold: updated.gold,
      cost,
      mode: "gold",
      softCap,
      isAboveSoftCap: updated[statKey] > softCap,
    });
  } catch (error) {
    console.error("[api/characters/[id]/allocate-stats POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
