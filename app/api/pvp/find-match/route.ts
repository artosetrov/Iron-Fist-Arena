import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { ratingChange, getRankFromRating } from "@/lib/game/elo";
import { spendStamina, STAMINA_COST } from "@/lib/game/stamina";
import { getCurrentSeasonNumber } from "@/lib/db/season";
import {
  goldForPvPWin,
  goldForPvPLoss,
  scaleXpByLevel,
  XP_REWARD,
} from "@/lib/game/progression";
import { applyLevelUp } from "@/lib/game/levelUp";
import { updateDailyQuestProgress } from "@/lib/game/quests";
import type { CharacterClass, CharacterOrigin } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId as string;
    const opponentId = body.opponentId as string | undefined;
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      include: { user: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const isVip = !!character.user?.premiumUntil && character.user.premiumUntil > new Date();
    const staminaResult = spendStamina({
      currentStamina: character.currentStamina,
      maxStamina: character.maxStamina,
      lastStaminaUpdate: character.lastStaminaUpdate,
      cost: STAMINA_COST.PVP,
      isVip,
    });
    if ("error" in staminaResult) {
      return NextResponse.json({ error: staminaResult.error }, { status: 400 });
    }

    const seasonNumber = await getCurrentSeasonNumber();

    // Find opponent
    let opponent: Awaited<ReturnType<typeof prisma.character.findFirst>> = null;

    if (opponentId) {
      opponent = await prisma.character.findFirst({
        where: { id: opponentId, userId: { not: authUser.id } },
      });
    }

    if (!opponent) {
      const ratingRange = 100;
      const opponents = await prisma.character.findMany({
        where: {
          id: { not: characterId },
          userId: { not: authUser.id },
          pvpRating: {
            gte: character.pvpRating - ratingRange,
            lte: character.pvpRating + ratingRange,
          },
        },
        take: 10,
        orderBy: { pvpRating: "asc" },
      });
      opponent = opponents[Math.floor(Math.random() * opponents.length)] ?? null;
      if (!opponent) {
        opponent = await prisma.character.findFirst({
          where: { id: { not: characterId }, userId: { not: authUser.id } },
        });
      }
    }

    if (!opponent) {
      return NextResponse.json(
        { error: "No opponents available. Try again later." },
        { status: 503 }
      );
    }

    const playerState = buildCombatantState({
      id: character.id,
      name: character.characterName,
      class: character.class as CharacterClass,
      origin: character.origin as CharacterOrigin,
      level: character.level,
      strength: character.strength,
      agility: character.agility,
      vitality: character.vitality,
      endurance: character.endurance,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      luck: character.luck,
      charisma: character.charisma,
      armor: character.armor,
    });

    const opponentState = buildCombatantState({
      id: opponent.id,
      name: opponent.characterName,
      class: opponent.class as CharacterClass,
      origin: opponent.origin as CharacterOrigin,
      level: opponent.level,
      strength: opponent.strength,
      agility: opponent.agility,
      vitality: opponent.vitality,
      endurance: opponent.endurance,
      intelligence: opponent.intelligence,
      wisdom: opponent.wisdom,
      luck: opponent.luck,
      charisma: opponent.charisma,
      armor: opponent.armor,
    });

    const result = runCombat(playerState, opponentState, []);

    const winnerId = result.winnerId;
    const loserId = result.loserId;
    const draw = result.draw;

    const playerWon = winnerId === character.id;
    const oppWon = winnerId === opponent.id;

    const delta1 = draw
      ? 0
      : ratingChange(character.pvpRating, opponent.pvpRating, playerWon ? 1 : 0);
    const delta2 = draw
      ? 0
      : ratingChange(opponent.pvpRating, character.pvpRating, oppWon ? 1 : 0);

    const newRating1 = Math.max(0, character.pvpRating + delta1);
    const newRating2 = Math.max(0, opponent.pvpRating + delta2);

    const gold1 = playerWon
      ? goldForPvPWin(opponent.pvpRating, character.pvpWinStreak)
      : goldForPvPLoss();
    const gold2 = oppWon
      ? goldForPvPWin(character.pvpRating, opponent.pvpWinStreak)
      : goldForPvPLoss();

    const xp1 = playerWon
      ? scaleXpByLevel(XP_REWARD.PVP_WIN, opponent.level)
      : scaleXpByLevel(XP_REWARD.PVP_LOSS, opponent.level);
    const xp2 = oppWon
      ? scaleXpByLevel(XP_REWARD.PVP_WIN, character.level)
      : scaleXpByLevel(XP_REWARD.PVP_LOSS, character.level);

    const newWinStreak1 = playerWon ? character.pvpWinStreak + 1 : 0;
    const newWinStreak2 = oppWon ? opponent.pvpWinStreak + 1 : 0;

    const afterXp = character.currentXp + xp1;
    const afterGold = character.gold + gold1;
    const levelUp = applyLevelUp({
      level: character.level,
      currentXp: afterXp,
      statPointsAvailable: character.statPointsAvailable,
      gold: afterGold,
      maxHp: character.maxHp,
    });

    // FIX: Wrap all DB writes in a single transaction to prevent partial state
    await prisma.$transaction(async (tx) => {
      await tx.pvpMatch.create({
        data: {
          player1Id: character.id,
          player2Id: opponent!.id,
          player1RatingBefore: character.pvpRating,
          player2RatingBefore: opponent!.pvpRating,
          player1RatingAfter: newRating1,
          player2RatingAfter: newRating2,
          winnerId: winnerId ?? character.id,
          loserId: loserId ?? opponent!.id,
          combatLog: result.log as object,
          turnsTaken: result.turns,
          player1GoldReward: gold1,
          player2GoldReward: gold2,
          player1XpReward: xp1,
          player2XpReward: xp2,
          matchType: "ranked",
          seasonNumber,
        },
      });

      await tx.character.update({
        where: { id: character.id },
        data: {
          pvpRating: newRating1,
          pvpWins: { increment: playerWon ? 1 : 0 },
          pvpLosses: { increment: playerWon ? 0 : 1 },
          pvpWinStreak: newWinStreak1,
          highestPvpRank: getRankFromRating(newRating1),
          gold: levelUp.gold,
          currentXp: levelUp.currentXp,
          level: levelUp.level,
          statPointsAvailable: levelUp.statPointsAvailable,
          currentHp: levelUp.currentHp,
          currentStamina: staminaResult.newStamina,
          lastStaminaUpdate: staminaResult.newLastUpdate,
        },
      });

      await tx.character.update({
        where: { id: opponent!.id },
        data: {
          pvpRating: newRating2,
          pvpWins: { increment: oppWon ? 1 : 0 },
          pvpLosses: { increment: oppWon ? 0 : 1 },
          pvpWinStreak: newWinStreak2,
          highestPvpRank: getRankFromRating(newRating2),
          gold: { increment: gold2 },
          currentXp: { increment: xp2 },
        },
      });
    });

    if (playerWon) {
      await updateDailyQuestProgress(character.id, "pvp_wins", 1);
    }

    return NextResponse.json({
      winnerId: result.winnerId,
      loserId: result.loserId,
      draw: result.draw,
      turns: result.turns,
      log: result.log,
      playerSnapshot: result.playerSnapshot,
      enemySnapshot: result.enemySnapshot,
      opponent: {
        id: opponent.id,
        characterName: opponent.characterName,
        class: opponent.class,
        level: opponent.level,
        pvpRating: opponent.pvpRating,
      },
      rewards: {
        gold: gold1,
        xp: xp1,
        ratingChange: delta1,
        newRating: newRating1,
        won: playerWon,
      },
    });
  } catch (error) {
    console.error("[api/pvp/find-match POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
