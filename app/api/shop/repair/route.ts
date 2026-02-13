import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { REPAIR_COST_PCT, REPAIR_FALLBACK_PRICE } from "@/lib/game/balance";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GDD §7.4 - Repair cost = 10% of purchase price * (durability lost / 100) */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { prefix: "repair", windowMs: 10_000, maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    const inventoryId = body.inventoryId as string;

    if (!characterId || !inventoryId) {
      return NextResponse.json({ error: "characterId, inventoryId required" }, { status: 400 });
    }

    // FIX: Atomic transaction with conditional gold check
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.equipmentInventory.findFirst({
        where: { id: inventoryId, characterId },
        include: { item: true, character: true },
      });
      if (!inv || inv.character.userId !== user.id) {
        return { error: "Not found", status: 404 } as const;
      }

      const lost = inv.maxDurability - inv.durability;
      if (lost <= 0) {
        return { error: "Item is not damaged", status: 400 } as const;
      }

      const basePrice = inv.item.buyPrice ?? inv.item.sellPrice ?? REPAIR_FALLBACK_PRICE;
      const cost = Math.max(1, Math.floor((basePrice * REPAIR_COST_PCT * lost) / inv.maxDurability));

      if (inv.character.gold < cost) {
        return { error: "Not enough gold", status: 400 } as const;
      }

      await tx.equipmentInventory.update({
        where: { id: inventoryId },
        data: { durability: inv.maxDurability },
      });
      await tx.character.update({
        where: { id: characterId },
        data: { gold: { decrement: cost } },
      });

      return { ok: true, cost } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, cost: result.cost });
  } catch (error) {
    console.error("[api/shop/repair POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
