import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { applyRegen } from "@/lib/game/stamina";

export async function GET(
  _request: Request,
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

    // FIX: Single query with equipment included (was two separate queries)
    const character = await prisma.character.findFirst({
      where: { id, userId: authUser.id },
      include: {
        user: true,
        equipment: {
          where: { isEquipped: true },
          include: { item: true },
        },
      },
    });
    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isVip = !!character.user?.premiumUntil && character.user.premiumUntil > new Date();
    const lastUpdate =
      character.lastStaminaUpdate instanceof Date
        ? character.lastStaminaUpdate
        : new Date(character.lastStaminaUpdate);
    const { currentStamina, lastStaminaUpdate } = applyRegen({
      currentStamina: character.currentStamina,
      maxStamina: character.maxStamina,
      lastStaminaUpdate: lastUpdate,
      isVip,
    });
    const needsUpdate =
      currentStamina !== character.currentStamina ||
      lastStaminaUpdate.getTime() !== lastUpdate.getTime();
    if (needsUpdate) {
      await prisma.character.update({
        where: { id: character.id },
        data: { currentStamina, lastStaminaUpdate },
      });
    }

    const { user: _u, ...rest } = character;
    return NextResponse.json({
      ...rest,
      currentStamina,
      lastStaminaUpdate: lastStaminaUpdate.toISOString(),
    });
  } catch (err) {
    console.error("[api/characters/[id] GET]", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to load character";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
