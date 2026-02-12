import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/** GDD §7.5 - Success 75% - 5*level, on fail: 50% stay, 30% -1, 20% destroy */
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

    // Roll dice outside transaction (pure logic, no DB dependency)
    const successRoll = Math.random() * 100;
    const failRoll = Math.random() * 100;

    // FIX: Atomic transaction with conditional gold check
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.equipmentInventory.findFirst({
        where: { id: inventoryId, characterId },
        include: { item: true, character: true },
      });
      if (!inv || inv.character.userId !== user.id) {
        return { error: "Not found", status: 404 } as const;
      }

      if (inv.upgradeLevel >= 10) {
        return { error: "Already at max upgrade level", status: 400 } as const;
      }

      const basePrice = inv.item.buyPrice ?? 100;
      const cost = Math.max(1, Math.floor(basePrice * Math.pow(0.2 * (inv.upgradeLevel + 1), 1.5)));
      if (inv.character.gold < cost) {
        return { error: "Not enough gold", status: 400 } as const;
      }

      const successChance = 75 - inv.upgradeLevel * 5;
      let newLevel = inv.upgradeLevel;
      let destroyed = false;

      if (successRoll < successChance) {
        newLevel = inv.upgradeLevel + 1;
      } else {
        if (failRoll < 50) {
          newLevel = inv.upgradeLevel;
        } else if (failRoll < 80) {
          newLevel = Math.max(0, inv.upgradeLevel - 1);
        } else {
          destroyed = true;
        }
      }

      // Deduct gold atomically
      await tx.character.update({
        where: { id: characterId },
        data: { gold: { decrement: cost } },
      });

      if (destroyed) {
        await tx.equipmentInventory.delete({ where: { id: inventoryId } });
        return { ok: true, success: false, destroyed: true, cost } as const;
      }

      await tx.equipmentInventory.update({
        where: { id: inventoryId },
        data: { upgradeLevel: newLevel },
      });

      return {
        ok: true,
        success: newLevel > inv.upgradeLevel,
        newLevel,
        cost,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/shop/upgrade POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
