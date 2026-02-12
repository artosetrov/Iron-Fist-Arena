import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getConsumableDef, type ConsumableType } from "@/lib/game/consumable-catalog";
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

    const rl = checkRateLimit(authUser.id, { prefix: "buy-consumable", windowMs: 10_000, maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
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

      // Check stack limit
      const existing = await tx.consumableInventory.findUnique({
        where: { characterId_consumableType: { characterId, consumableType } },
      });
      if (existing && existing.quantity >= def.maxStack) {
        return { error: `Stack limit reached (max ${def.maxStack})`, status: 400 } as const;
      }

      // Check currency
      if (def.currency === "gold") {
        if (character.gold < def.cost) {
          return { error: "Not enough gold", status: 400 } as const;
        }
        await tx.character.update({
          where: { id: characterId },
          data: { gold: { decrement: def.cost } },
        });
      } else {
        // gems are on User
        if ((character.user?.gems ?? 0) < def.cost) {
          return { error: "Not enough gems", status: 400 } as const;
        }
        await tx.user.update({
          where: { id: authUser.id },
          data: { gems: { decrement: def.cost } },
        });
      }

      // Upsert consumable inventory
      const inv = await tx.consumableInventory.upsert({
        where: { characterId_consumableType: { characterId, consumableType } },
        update: { quantity: { increment: 1 } },
        create: { characterId, consumableType, quantity: 1 },
      });

      // Get updated character for response
      const updatedChar = await tx.character.findUnique({
        where: { id: characterId },
        select: { gold: true },
      });
      const updatedUser = await tx.user.findUnique({
        where: { id: authUser.id },
        select: { gems: true },
      });

      return {
        ok: true,
        quantity: inv.quantity,
        gold: updatedChar?.gold ?? character.gold,
        gems: updatedUser?.gems ?? 0,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/shop/buy-consumable POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
