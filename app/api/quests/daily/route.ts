import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { QUEST_POOL, DAILY_QUEST_COUNT } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

const getDayStart = (d: Date): Date => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

/** Pick N unique random items from array using Fisher-Yates */
const pickUnique = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
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

    const today = getDayStart(new Date());
    let quests = await prisma.dailyQuest.findMany({
      where: { characterId, day: today },
    });

    if (quests.length === 0) {
      // FIX: Pick unique quests to avoid duplicates
      const chosen = pickUnique([...QUEST_POOL], DAILY_QUEST_COUNT);

      try {
        await prisma.dailyQuest.createMany({
          data: chosen.map((q) => ({
            characterId,
            questType: q.questType,
            target: q.target,
            rewardGold: q.rewardGold,
            rewardXp: q.rewardXp,
            rewardGems: q.rewardGems,
            day: today,
          })),
        });
      } catch (e) {
        // FIX: Handle P2002 (duplicate key) from concurrent creation
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          // Another request already created quests, just fetch them
        } else {
          throw e;
        }
      }

      quests = await prisma.dailyQuest.findMany({
        where: { characterId, day: today },
      });
    }

    return NextResponse.json({ quests });
  } catch (error) {
    console.error("[api/quests/daily GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
