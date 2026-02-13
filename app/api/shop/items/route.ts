import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Max items shown per slot+rarity combo to keep the shop clean */
const MAX_PER_SLOT_RARITY = 3;

/** Deterministic daily seed so the shop rotation is stable for the whole day */
const getDailySeed = (): number => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** Simple seeded shuffle (Fisher-Yates with LCG) */
const seededShuffle = <T>(arr: T[], seed: number): T[] => {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

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
    const allItems = await prisma.item.findMany({
      where: {
        itemLevel: { gte: Math.max(1, charLevel - 1), lte: charLevel + 2 },
        buyPrice: { not: null },
        rarity: { not: "legendary" },
        catalogId: { not: null },
      },
      orderBy: [{ itemLevel: "asc" }, { rarity: "asc" }, { itemType: "asc" }],
    });

    // Limit to MAX_PER_SLOT_RARITY per (itemType + rarity) with daily rotation
    const seed = getDailySeed();
    const buckets = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const key = `${item.itemType}__${item.rarity}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(item);
    }

    const items: typeof allItems = [];
    for (const bucket of Array.from(buckets.values())) {
      if (bucket.length <= MAX_PER_SLOT_RARITY) {
        items.push(...bucket);
      } else {
        items.push(...seededShuffle(bucket, seed).slice(0, MAX_PER_SLOT_RARITY));
      }
    }

    // Re-sort for consistent display order
    items.sort((a, b) => {
      const rarityOrder = ["common", "rare", "epic"];
      const ra = rarityOrder.indexOf(a.rarity);
      const rb = rarityOrder.indexOf(b.rarity);
      if (ra !== rb) return rb - ra;
      if (a.itemType !== b.itemType) return a.itemType.localeCompare(b.itemType);
      return a.itemLevel - b.itemLevel;
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/shop/items GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
