import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INVENTORY_LIMIT = 50;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId as string;
    const itemId = body.itemId as string;

    if (!characterId || !itemId) {
      return NextResponse.json({ error: "characterId, itemId required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });
    if (!item || item.buyPrice == null) {
      return NextResponse.json({ error: "Item not found or not for sale" }, { status: 404 });
    }

    const cost = item.buyPrice;

    // FIX: Atomic transaction with conditional gold check to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: user.id },
        include: { equipment: { select: { id: true } } },
      });
      if (!character) return { error: "Character not found", status: 404 } as const;

      if (character.equipment.length >= INVENTORY_LIMIT) {
        return { error: "Inventory is full", status: 400 } as const;
      }

      if (character.gold < cost) {
        return { error: "Not enough gold", status: 400 } as const;
      }

      const inv = await tx.equipmentInventory.create({
        data: { characterId, itemId },
      });

      await tx.character.update({
        where: { id: characterId },
        data: { gold: { decrement: cost } },
      });

      return { ok: true, inventoryId: inv.id } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, inventoryId: result.inventoryId });
  } catch (error) {
    console.error("[api/shop/buy POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
