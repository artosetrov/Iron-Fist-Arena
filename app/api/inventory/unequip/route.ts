import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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
    const inventoryId = body.inventoryId as string;

    if (!characterId || !inventoryId) {
      return NextResponse.json({ error: "characterId, inventoryId required" }, { status: 400 });
    }

    // FIX: Unequip + armor update in a single transaction
    await prisma.$transaction(async (tx) => {
      const inv = await tx.equipmentInventory.findFirst({
        where: { id: inventoryId, characterId },
        include: { character: true },
      });
      if (!inv || !inv.isEquipped || inv.character.userId !== user.id) {
        throw new Error("NOT_FOUND");
      }

      await tx.equipmentInventory.update({
        where: { id: inventoryId },
        data: { isEquipped: false, equippedSlot: null },
      });

      // Recalculate armor in the same transaction
      const character = await tx.character.findFirst({
        where: { id: characterId },
        include: { equipment: { where: { isEquipped: true }, include: { item: true } } },
      });
      const armor = character?.equipment?.reduce(
        (sum, e) => {
          const bs = e.item.baseStats as Record<string, number> | null;
          return sum + (bs?.armor ?? bs?.ARMOR ?? 0);
        },
        0
      ) ?? 0;
      await tx.character.update({
        where: { id: characterId },
        data: { armor },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Item not found or not equipped" }, { status: 404 });
    }
    console.error("[api/inventory/unequip POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
