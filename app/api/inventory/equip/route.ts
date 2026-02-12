import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { EquippedSlot } from "@prisma/client";

const SLOTS: EquippedSlot[] = ["weapon", "helmet", "chest", "gloves", "legs", "boots", "accessory"];

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
    const slot = body.slot as string;

    if (!characterId || !inventoryId || !SLOTS.includes(slot as EquippedSlot)) {
      return NextResponse.json({ error: "characterId, inventoryId, slot required" }, { status: 400 });
    }

    // FIX: Equip + armor update in a single transaction
    await prisma.$transaction(async (tx) => {
      const inv = await tx.equipmentInventory.findFirst({
        where: { id: inventoryId, characterId },
        include: { item: true, character: true },
      });
      if (!inv || inv.character.userId !== user.id) {
        throw new Error("NOT_FOUND");
      }

      const itemType = inv.item.itemType.toLowerCase();
      const slotMap: Record<string, string> = {
        weapon: "weapon",
        helmet: "helmet",
        chest: "chest",
        gloves: "gloves",
        legs: "legs",
        boots: "boots",
        accessory: "accessory",
      };
      if (slotMap[itemType] !== slot) {
        throw new Error("SLOT_MISMATCH");
      }

      // Unequip current item in the slot
      await tx.equipmentInventory.updateMany({
        where: { characterId, equippedSlot: slot as EquippedSlot },
        data: { isEquipped: false, equippedSlot: null },
      });

      // Equip new item
      await tx.equipmentInventory.update({
        where: { id: inventoryId },
        data: { isEquipped: true, equippedSlot: slot as EquippedSlot },
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
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "SLOT_MISMATCH") {
      return NextResponse.json({ error: "Item type does not match slot" }, { status: 400 });
    }
    console.error("[api/inventory/equip POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
