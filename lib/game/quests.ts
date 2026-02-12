import { prisma } from "@/lib/db";
import { applyLevelUp } from "@/lib/game/levelUp";

export const updateDailyQuestProgress = async (
  characterId: string,
  questType: "pvp_wins" | "dungeons_complete",
  amount: number = 1
): Promise<void> => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { userId: true },
  });
  if (!character) return;

  const quests = await prisma.dailyQuest.findMany({
    where: { characterId, day: today, questType, completed: false },
  });

  for (const q of quests) {
    const newProgress = q.progress + amount;
    if (newProgress >= q.target) {
      // Atomic: only complete if not already completed (prevents double-reward race)
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.dailyQuest.findUnique({ where: { id: q.id } });
        if (!fresh || fresh.completed) return; // Already completed by another request

        await tx.dailyQuest.update({
          where: { id: q.id },
          data: { progress: q.target, completed: true },
        });
        const char = await tx.character.findUniqueOrThrow({
          where: { id: characterId },
          select: { level: true, currentXp: true, statPointsAvailable: true, gold: true, maxHp: true },
        });
        const questLevelUp = applyLevelUp({
          level: char.level,
          currentXp: char.currentXp + q.rewardXp,
          statPointsAvailable: char.statPointsAvailable,
          gold: char.gold + q.rewardGold,
          maxHp: char.maxHp,
        });
        await tx.character.update({
          where: { id: characterId },
          data: {
            gold: questLevelUp.gold,
            currentXp: questLevelUp.currentXp,
            level: questLevelUp.level,
            statPointsAvailable: questLevelUp.statPointsAvailable,
            currentHp: questLevelUp.currentHp,
          },
        });
        await tx.user.update({
          where: { id: character.userId },
          data: { gems: { increment: q.rewardGems } },
        });
      });
    } else {
      await prisma.dailyQuest.update({
        where: { id: q.id },
        data: { progress: { increment: amount } },
      });
    }
  }
}
