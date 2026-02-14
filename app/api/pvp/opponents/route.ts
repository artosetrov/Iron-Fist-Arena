import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { PVP_OPPONENTS_RATING_RANGE } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

/**
 * GET /api/pvp/opponents?characterId=xxx
 * Returns up to 3 opponents close to the player's rating for card-based selection.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      select: { id: true, pvpRating: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const ratingRange = PVP_OPPONENTS_RATING_RANGE;
    const candidates = await prisma.character.findMany({
      where: {
        id: { not: characterId },
        userId: { not: authUser.id },
        pvpRating: {
          gte: character.pvpRating - ratingRange,
          lte: character.pvpRating + ratingRange,
        },
      },
      take: 20,
      orderBy: { pvpRating: "asc" },
      select: {
        id: true,
        characterName: true,
        class: true,
        origin: true,
        level: true,
        pvpRating: true,
        strength: true,
        agility: true,
        vitality: true,
        intelligence: true,
        luck: true,
      },
    });

    // If not enough close opponents, grab any
    if (candidates.length < 3) {
      const fallback = await prisma.character.findMany({
        where: {
          id: { not: characterId, notIn: candidates.map((c) => c.id) },
          userId: { not: authUser.id },
        },
        take: 3 - candidates.length,
        orderBy: { pvpRating: "asc" },
        select: {
          id: true,
          characterName: true,
          class: true,
          origin: true,
          level: true,
          pvpRating: true,
          strength: true,
          agility: true,
          vitality: true,
          intelligence: true,
          luck: true,
        },
      });
      candidates.push(...fallback);
    }

    // Fisher-Yates shuffle and pick 3
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const shuffled = candidates.slice(0, 3);

    // Fetch equipped items for selected opponents
    const opponentIds = shuffled.map((c) => c.id);
    const equippedItems = await prisma.equipmentInventory.findMany({
      where: { characterId: { in: opponentIds }, isEquipped: true },
      select: {
        characterId: true,
        equippedSlot: true,
        item: {
          select: {
            itemName: true,
            itemType: true,
            rarity: true,
          },
        },
      },
    });

    const equippedByCharacter = new Map<string, { slot: string; itemName: string; itemType: string; rarity: string }[]>();
    for (const eq of equippedItems) {
      if (!eq.equippedSlot) continue;
      const list = equippedByCharacter.get(eq.characterId) ?? [];
      list.push({ slot: eq.equippedSlot, itemName: eq.item.itemName, itemType: eq.item.itemType, rarity: eq.item.rarity });
      equippedByCharacter.set(eq.characterId, list);
    }

    const opponents = shuffled.map((c) => ({
      ...c,
      equipped: equippedByCharacter.get(c.id) ?? [],
    }));

    return NextResponse.json({ opponents });
  } catch (error) {
    console.error("[api/pvp/opponents GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
