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
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
    });
    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const charLevel = character.level;

    // All items filtered by character level window [-1, +2], no legendary (drop-only)
    const items = await prisma.item.findMany({
      where: {
        itemLevel: { gte: Math.max(1, charLevel - 1), lte: charLevel + 2 },
        buyPrice: { not: null },
        rarity: { not: "legendary" },
      },
      orderBy: [{ itemLevel: "asc" }, { rarity: "asc" }, { itemType: "asc" }],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/shop/items GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
