import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { SELL_RARITY_MULT, SELL_BASE_MULT, SELL_STAT_MULT } from "@/lib/game/balance";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GDD §7.2 — Item Selling
 * Sell_Price = (Item_Level × Rarity_Mult × 10) + Stat_Bonus_Value
 * Stat_Bonus_Value = sum of all base stats × 5
 */

const calculateSellPrice = (
  itemLevel: number,
  rarity: string,
  baseStats: Record<string, number> | null
): number => {
  const rarityMult = SELL_RARITY_MULT[rarity] ?? 1;
  const statBonusValue = baseStats
    ? Object.values(baseStats).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0) * SELL_STAT_MULT
    : 0;
  return itemLevel * rarityMult * SELL_BASE_MULT + statBonusValue;
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { prefix: "sell", windowMs: 5_000, maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId as string;
    const inventoryId = body.inventoryId as string;

    if (!characterId || !inventoryId) {
      return NextResponse.json(
        { error: "characterId and inventoryId required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.equipmentInventory.findFirst({
        where: { id: inventoryId, characterId },
        include: { item: true, character: true },
      });

      if (!inv || inv.character.userId !== user.id) {
        throw new Error("NOT_FOUND");
      }

      if (inv.isEquipped) {
        throw new Error("EQUIPPED");
      }

      const sellPrice =
        inv.item.sellPrice ??
        calculateSellPrice(
          inv.item.itemLevel,
          inv.item.rarity,
          inv.item.baseStats as Record<string, number> | null
        );

      // Remove item from inventory
      await tx.equipmentInventory.delete({ where: { id: inventoryId } });

      // Add gold to character
      const updated = await tx.character.update({
        where: { id: characterId },
        data: { gold: { increment: sellPrice } },
        select: { gold: true },
      });

      return { sellPrice, newGold: updated.gold, itemName: inv.item.itemName };
    });

    return NextResponse.json({
      ok: true,
      sellPrice: result.sellPrice,
      newGold: result.newGold,
      itemName: result.itemName,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "EQUIPPED") {
      return NextResponse.json(
        { error: "Cannot sell equipped item. Unequip it first." },
        { status: 400 }
      );
    }
    console.error("[api/inventory/sell POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
