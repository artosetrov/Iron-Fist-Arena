import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("characterId");
    const level = Math.max(1, parseInt(searchParams.get("level") ?? "1", 10));
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
    });
    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Generic items filtered by character level
    const genericItems = await prisma.item.findMany({
      where: {
        catalogId: null,
        itemLevel: { gte: Math.max(1, level - 2), lte: level + 5 },
        buyPrice: { not: null },
      },
      take: 50,
    });

    // Catalog items (Item System v1.0) — always available in shop
    const catalogItems = await prisma.item.findMany({
      where: {
        catalogId: { not: null },
        buyPrice: { not: null },
      },
      orderBy: [{ rarity: "asc" }, { itemType: "asc" }],
    });

    const items = [...catalogItems, ...genericItems];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/shop/items GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
