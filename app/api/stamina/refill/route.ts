import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { applyRegen, getMaxStamina, OVERFLOW_CAP } from "@/lib/game/stamina";
import { STAMINA_REFILL, type StaminaRefillSize } from "@/lib/game/balance";

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
    const size = (body.size as string) || "small";

    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const refillDef = STAMINA_REFILL[size as StaminaRefillSize];
    if (!refillDef) {
      return NextResponse.json({ error: "size must be small|medium|large" }, { status: 400 });
    }

    const cost = refillDef.gems;
    const addStamina = refillDef.stamina;

    // FIX: Atomic transaction with conditional gems check
    const result = await prisma.$transaction(async (tx) => {
      const userRecord = await tx.user.findUnique({ where: { id: authUser.id } });
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: authUser.id },
        include: { user: true },
      });
      if (!userRecord || !character) {
        return { error: "Not found", status: 404 } as const;
      }

      if (userRecord.gems < cost) {
        return { error: "Not enough gems", status: 400 } as const;
      }

      const isVip = !!character.user?.premiumUntil && character.user.premiumUntil > new Date();
      const maxStamina = getMaxStamina(isVip);

      const { currentStamina, lastStaminaUpdate } = applyRegen({
        currentStamina: character.currentStamina,
        maxStamina: character.maxStamina,
        lastStaminaUpdate: character.lastStaminaUpdate,
        isVip,
      });

      const newStamina = Math.min(OVERFLOW_CAP, currentStamina + addStamina);

      await tx.user.update({
        where: { id: authUser.id },
        data: { gems: { decrement: cost } },
      });
      await tx.character.update({
        where: { id: characterId },
        data: { currentStamina: newStamina, lastStaminaUpdate },
      });

      return { ok: true, currentStamina: newStamina, maxStamina, gemsSpent: cost } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/stamina/refill POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
