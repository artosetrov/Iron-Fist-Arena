import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getPotionById } from "@/lib/game/potion-catalog";
import { applyRegen, OVERFLOW_CAP, getMaxStamina } from "@/lib/game/stamina";
import { checkRateLimit } from "@/lib/rate-limit";

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

    const rl = checkRateLimit(authUser.id, { prefix: "buy-potion", windowMs: 10_000, maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    const potionId = body.potionId as string;

    if (!characterId || !potionId) {
      return NextResponse.json(
        { error: "characterId and potionId required" },
        { status: 400 }
      );
    }

    const potion = getPotionById(potionId);
    if (!potion) {
      return NextResponse.json({ error: "Unknown potion" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: authUser.id },
        include: { user: true },
      });
      if (!character) {
        return { error: "Character not found", status: 404 } as const;
      }

      if (character.gold < potion.goldCost) {
        return { error: "Not enough gold", status: 400 } as const;
      }

      const isVip =
        !!character.user?.premiumUntil &&
        character.user.premiumUntil > new Date();
      const maxStamina = getMaxStamina(isVip);

      const { currentStamina, lastStaminaUpdate } = applyRegen({
        currentStamina: character.currentStamina,
        maxStamina: character.maxStamina,
        lastStaminaUpdate: character.lastStaminaUpdate,
        isVip,
      });

      if (currentStamina >= OVERFLOW_CAP) {
        return { error: "Stamina is already at overflow cap", status: 400 } as const;
      }

      const newStamina = Math.min(OVERFLOW_CAP, currentStamina + potion.staminaRestore);

      await tx.character.update({
        where: { id: characterId },
        data: {
          gold: { decrement: potion.goldCost },
          currentStamina: newStamina,
          lastStaminaUpdate,
        },
      });

      return {
        ok: true,
        currentStamina: newStamina,
        maxStamina,
        goldSpent: potion.goldCost,
        staminaRestored: potion.staminaRestore,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/shop/buy-potion POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
