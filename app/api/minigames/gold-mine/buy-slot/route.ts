import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { GOLD_MINE_SLOT_COST_GEMS, GOLD_MINE_MAX_SLOTS, GOLD_MINE_FREE_SLOTS } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

/* ────────────────── POST — Buy additional mining slot ────────────────── */

export const POST = async (request: Request) => {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, {
      prefix: "gold_mine_buy_slot",
      windowMs: 5_000,
      maxRequests: 3,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId as string;

    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const maxPurchasable = GOLD_MINE_MAX_SLOTS - GOLD_MINE_FREE_SLOTS;

    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: user.id },
        select: { id: true, goldMineSlots: true },
      });
      if (!character) return { error: "Character not found", status: 404 } as const;

      if (character.goldMineSlots >= maxPurchasable) {
        return { error: "Maximum slots already purchased", status: 400 } as const;
      }

      // Check gems
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { gems: true },
      });
      if (!dbUser || dbUser.gems < GOLD_MINE_SLOT_COST_GEMS) {
        return { error: `Not enough gems (need ${GOLD_MINE_SLOT_COST_GEMS})`, status: 400 } as const;
      }

      // Deduct gems
      await tx.user.update({
        where: { id: user.id },
        data: { gems: { decrement: GOLD_MINE_SLOT_COST_GEMS } },
      });

      // Increment purchased slots
      const updated = await tx.character.update({
        where: { id: characterId },
        data: { goldMineSlots: { increment: 1 } },
        select: { goldMineSlots: true },
      });

      return {
        ok: true,
        purchasedSlots: updated.goldMineSlots,
        maxSlots: GOLD_MINE_FREE_SLOTS + updated.goldMineSlots,
        gemsSpent: GOLD_MINE_SLOT_COST_GEMS,
        gemsRemaining: dbUser.gems - GOLD_MINE_SLOT_COST_GEMS,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/minigames/gold-mine/buy-slot POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
