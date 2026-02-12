import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      usersCount,
      charactersCount,
      characterAgg,
      pvpMatchesCount,
      itemsCount,
      dungeonProgressCount,
      equipmentCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.character.count(),
      prisma.character.aggregate({
        _avg: { level: true, pvpRating: true },
        _max: { level: true, pvpRating: true },
      }),
      prisma.pvpMatch.count(),
      prisma.item.count(),
      prisma.dungeonProgress.count(),
      prisma.equipmentInventory.count(),
    ]);

    return NextResponse.json({
      users: usersCount,
      characters: charactersCount,
      avgLevel: Math.round((characterAgg._avg.level ?? 0) * 10) / 10,
      maxLevel: characterAgg._max.level ?? 0,
      avgPvpRating: Math.round(characterAgg._avg.pvpRating ?? 0),
      maxPvpRating: characterAgg._max.pvpRating ?? 0,
      pvpMatches: pvpMatchesCount,
      items: itemsCount,
      dungeonProgress: dungeonProgressCount,
      equipment: equipmentCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/dev/stats GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
