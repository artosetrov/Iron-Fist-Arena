import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getConsumableDef, type ConsumableType } from "@/lib/game/consumable-catalog";
import { applyRegen, OVERFLOW_CAP, getMaxStamina } from "@/lib/game/stamina";

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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    const consumableType = body.consumableType as ConsumableType;

    if (!characterId || !consumableType) {
      return NextResponse.json(
        { error: "characterId and consumableType required" },
        { status: 400 }
      );
    }

    const def = getConsumableDef(consumableType);
    if (!def) {
      return NextResponse.json({ error: "Unknown consumable type" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: authUser.id },
        include: { user: true },
      });
      if (!character) {
        return { error: "Character not found", status: 404 } as const;
      }

      // Check inventory
      const inv = await tx.consumableInventory.findUnique({
        where: { characterId_consumableType: { characterId, consumableType } },
      });
      if (!inv || inv.quantity <= 0) {
        return { error: "You don't have this consumable", status: 400 } as const;
      }

      // Apply regen first
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

      const newStamina = Math.min(OVERFLOW_CAP, currentStamina + def.staminaRestore);

      // Update character stamina
      await tx.character.update({
        where: { id: characterId },
        data: {
          currentStamina: newStamina,
          lastStaminaUpdate,
        },
      });

      // Decrement or delete inventory entry
      if (inv.quantity <= 1) {
        await tx.consumableInventory.delete({
          where: { id: inv.id },
        });
      } else {
        await tx.consumableInventory.update({
          where: { id: inv.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      return {
        ok: true,
        currentStamina: newStamina,
        maxStamina,
        staminaRestored: Math.min(def.staminaRestore, newStamina - currentStamina),
        remainingQuantity: inv.quantity - 1,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/consumables/use POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
