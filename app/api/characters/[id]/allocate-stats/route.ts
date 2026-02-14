import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { goldCostForStatTraining } from "@/lib/game/stat-training";
import { getMaxHp } from "@/lib/game/stats";
import { NextResponse } from "next/server";
import { STAT_SOFT_CAP, STAT_HARD_CAP, type StatKey } from "@/lib/game/balance";
import { checkRateLimit } from "@/lib/rate-limit";

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

    const rl = checkRateLimit(authUser.id, { prefix: "allocate-stats", windowMs: 5_000, maxRequests: 20 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const { id } = await params;

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
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

    // Soft cap for response
    const softCap = STAT_SOFT_CAP[statKey];

    // Wrap in transaction to prevent race conditions (double-spend stat points or gold)
    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id, userId: authUser.id },
      });
      if (!character) {
        return { error: "Character not found", status: 404 } as const;
      }

      const currentValue = character[statKey];

      if (currentValue >= STAT_HARD_CAP) {
        return { error: `${statKey} is already at hard cap (${STAT_HARD_CAP})`, status: 400 } as const;
      }

      const derivedUpdates =
        statKey === "vitality"
          ? { maxHp: getMaxHp(currentValue + 1) }
          : {};

      if (mode === "points") {
        if (character.statPointsAvailable <= 0) {
          return { error: "No stat points available", status: 400 } as const;
        }

        const updated = await tx.character.update({
          where: { id: character.id },
          data: {
            [statKey]: currentValue + 1,
            statPointsAvailable: character.statPointsAvailable - 1,
            ...derivedUpdates,
          },
        });

        return {
          success: true,
          stat: statKey,
          newValue: updated[statKey],
          statPointsAvailable: updated.statPointsAvailable,
          gold: updated.gold,
          mode: "points" as const,
        };
      }

      // mode === "gold"
      const cost = goldCostForStatTraining(currentValue);

      if (character.gold < cost) {
        return {
          error: `Not enough gold. Need ${cost}, have ${character.gold}`,
          cost,
          gold: character.gold,
          status: 400,
        } as const;
      }

      const updated = await tx.character.update({
        where: { id: character.id },
        data: {
          [statKey]: currentValue + 1,
          gold: character.gold - cost,
          ...derivedUpdates,
        },
      });

      return {
        success: true,
        stat: statKey,
        newValue: updated[statKey],
        statPointsAvailable: updated.statPointsAvailable,
        gold: updated.gold,
        cost,
        mode: "gold" as const,
        softCap,
        isAboveSoftCap: (updated[statKey] as number) > softCap,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, ...("cost" in result ? { cost: result.cost, gold: result.gold } : {}) },
        { status: result.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/characters/[id]/allocate-stats POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
