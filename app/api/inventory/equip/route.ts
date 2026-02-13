import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { EquippedSlot } from "@prisma/client";
import { isWeaponTwoHanded } from "@/lib/game/item-catalog";
import { aggregateArmor } from "@/lib/game/equipment-stats";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SLOTS: EquippedSlot[] = [
  "weapon",
  "weapon_offhand",
  "helmet",
  "chest",
  "gloves",
  "legs",
  "boots",
  "accessory",
  "amulet",
  "belt",
  "relic",
  "necklace",
  "ring",
];

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { prefix: "equip", windowMs: 5_000, maxRequests: 10 });
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
    const inventoryId = body.inventoryId as string;
    const slot = body.slot as string;

    if (!characterId || !inventoryId || !SLOTS.includes(slot as EquippedSlot)) {
      return NextResponse.json(
        { error: "characterId, inventoryId, slot required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const inv = await tx.equipmentInventory.findFirst({
        where: { id: inventoryId, characterId },
        include: { item: true, character: true },
      });
      if (!inv || inv.character.userId !== user.id) {
        throw new Error("NOT_FOUND");
      }

      const itemType = inv.item.itemType.toLowerCase();

      // Weapons can go into weapon or weapon_offhand slot
      const isWeaponSlot = slot === "weapon" || slot === "weapon_offhand";
      if (itemType === "weapon" && !isWeaponSlot) {
        throw new Error("SLOT_MISMATCH");
      }
      if (itemType !== "weapon" && isWeaponSlot) {
        throw new Error("SLOT_MISMATCH");
      }

      // Non-weapon items: must match their type to slot exactly
      if (!isWeaponSlot) {
        const armorSlotMap: Record<string, string> = {
          helmet: "helmet",
          chest: "chest",
          gloves: "gloves",
          legs: "legs",
          boots: "boots",
          accessory: "accessory",
          amulet: "amulet",
          belt: "belt",
          relic: "relic",
          necklace: "necklace",
          ring: "ring",
        };
        if (armorSlotMap[itemType] !== slot) {
          throw new Error("SLOT_MISMATCH");
        }
      }

      // --- Two-handed weapon validation ---
      const catalogId = inv.item.catalogId;
      const itemIsTwoHanded = catalogId ? isWeaponTwoHanded(catalogId) : false;

      // Two-handed weapons can only go in main hand
      if (itemIsTwoHanded && slot === "weapon_offhand") {
        throw new Error("TWO_HANDED_MAIN_ONLY");
      }

      // If equipping to offhand, check that main hand is not two-handed
      if (slot === "weapon_offhand") {
        const mainHandItem = await tx.equipmentInventory.findFirst({
          where: { characterId, equippedSlot: "weapon", isEquipped: true },
          include: { item: true },
        });
        if (mainHandItem?.item.catalogId) {
          if (isWeaponTwoHanded(mainHandItem.item.catalogId)) {
            throw new Error("OFFHAND_BLOCKED_BY_TWO_HANDED");
          }
        }
      }

      // Unequip current item in the slot
      await tx.equipmentInventory.updateMany({
        where: { characterId, equippedSlot: slot as EquippedSlot },
        data: { isEquipped: false, equippedSlot: null },
      });

      // If equipping a two-handed weapon, also unequip offhand
      if (itemIsTwoHanded && slot === "weapon") {
        await tx.equipmentInventory.updateMany({
          where: { characterId, equippedSlot: "weapon_offhand" },
          data: { isEquipped: false, equippedSlot: null },
        });
      }

      // Equip new item
      await tx.equipmentInventory.update({
        where: { id: inventoryId },
        data: { isEquipped: true, equippedSlot: slot as EquippedSlot },
      });

      // Recalculate armor from all equipped items
      const character = await tx.character.findFirst({
        where: { id: characterId },
        include: {
          equipment: { where: { isEquipped: true }, include: { item: true } },
        },
      });
      const armor = aggregateArmor(character?.equipment ?? []);
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
      return NextResponse.json(
        { error: "Item type does not match slot" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "TWO_HANDED_MAIN_ONLY") {
      return NextResponse.json(
        { error: "Two-handed weapons can only be equipped in main hand" },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      error.message === "OFFHAND_BLOCKED_BY_TWO_HANDED"
    ) {
      return NextResponse.json(
        { error: "Cannot equip off-hand: main hand weapon is two-handed" },
        { status: 400 }
      );
    }
    console.error("[api/inventory/equip POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
