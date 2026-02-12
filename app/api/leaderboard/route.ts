import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentSeasonNumber } from "@/lib/db/season";
import { getRankFromRating } from "@/lib/game/elo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const season = searchParams.get("season");

    const seasonNumber = season ? parseInt(season, 10) : await getCurrentSeasonNumber();

    const characters = await prisma.character.findMany({
      take: limit,
      orderBy: { pvpRating: "desc" },
      select: {
        id: true,
        characterName: true,
        class: true,
        level: true,
        pvpRating: true,
        pvpWins: true,
        pvpLosses: true,
        highestPvpRank: true,
      },
    });

    const withRank = characters.map((c, i) => ({
      rank: i + 1,
      ...c,
      currentRank: getRankFromRating(c.pvpRating),
    }));

    return NextResponse.json({
      season: seasonNumber,
      leaderboard: withRank,
    });
  } catch (error) {
    console.error("[api/leaderboard GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
