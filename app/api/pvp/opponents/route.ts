import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const ratingRange = 150;
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

    // Shuffle and pick 3
    const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 3);

    return NextResponse.json({ opponents: shuffled });
  } catch (error) {
    console.error("[api/pvp/opponents GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
