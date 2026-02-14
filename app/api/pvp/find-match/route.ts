import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { ratingChange, getRankFromRating, applyLossProtection, rankOrder } from "@/lib/game/elo";
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
import { aggregateEquipmentStats, aggregateZoneArmor } from "@/lib/game/equipment-stats";
import { PVP_MATCHMAKING_RATING_RANGE } from "@/lib/game/balance";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CharacterClass, CharacterOrigin } from "@prisma/client";
import { validateStance, defaultStance, generateRandomStance } from "@/lib/game/body-zones";
import type { CombatStance } from "@/lib/game/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(authUser.id, { prefix: "pvp", windowMs: 10_000, maxRequests: 3 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    const opponentId = body.opponentId as string | undefined;
    const stanceInput = body.stance as CombatStance | undefined;
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    // Validate stance if provided
    if (stanceInput) {
      const stanceErr = validateStance(stanceInput);
      if (stanceErr) {
        return NextResponse.json({ error: `Invalid stance: ${stanceErr}` }, { status: 400 });
      }
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      include: {
        user: true,
        equipment: { where: { isEquipped: true }, include: { item: true } },
      },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const seasonNumber = await getCurrentSeasonNumber();

    // Find opponent (with equipment for combat stats)
    type CharacterWithEquipment = Awaited<ReturnType<typeof prisma.character.findFirst<{
      include: { equipment: { where: { isEquipped: true }; include: { item: true } } };
    }>>>;
    let opponent: CharacterWithEquipment = null;

    const eqInclude = { equipment: { where: { isEquipped: true }, include: { item: true } } } as const;

    if (opponentId) {
      opponent = await prisma.character.findFirst({
        where: { id: opponentId, userId: { not: authUser.id } },
        include: eqInclude,
      });
    }

    if (!opponent) {
      const ratingRange = PVP_MATCHMAKING_RATING_RANGE;
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
        include: eqInclude,
      });
      opponent = opponents[Math.floor(Math.random() * opponents.length)] ?? null;
      if (!opponent) {
        opponent = await prisma.character.findFirst({
          where: { id: { not: characterId }, userId: { not: authUser.id } },
          include: eqInclude,
        });
      }
    }

    if (!opponent) {
      return NextResponse.json(
        { error: "No opponents available. Try again later." },
        { status: 503 }
      );
    }

    // Resolve player stance: from request body → saved in DB → default
    const playerStance: CombatStance =
      stanceInput ?? (character.combatStance as CombatStance | null) ?? defaultStance();

    const playerEqStats = aggregateEquipmentStats(character.equipment ?? [], character.class);
    const playerZoneArmor = aggregateZoneArmor(character.equipment ?? []);
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
      equipmentBonuses: playerEqStats,
      stance: playerStance,
      zoneArmor: playerZoneArmor,
    });

    // Resolve opponent stance: saved in DB → random
    const opponentStance: CombatStance =
      (opponent.combatStance as CombatStance | null) ?? generateRandomStance();

    const opponentEqStats = aggregateEquipmentStats(opponent.equipment ?? [], opponent.class);
    const opponentZoneArmor = aggregateZoneArmor(opponent.equipment ?? []);
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
      equipmentBonuses: opponentEqStats,
      stance: opponentStance,
      zoneArmor: opponentZoneArmor,
    });

    const result = runCombat(playerState, opponentState, []);

    const winnerId = result.winnerId;
    const loserId = result.loserId;
    const draw = result.draw;

    const playerWon = winnerId === character.id;
    const oppWon = winnerId === opponent.id;

    // Compute stamina spend (validation; actual DB write is inside transaction)
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

    // GDD §6.2 — ELO delta + §6.4 loss protection
    const rawDelta1 = draw
      ? 0
      : ratingChange(character.pvpRating, opponent.pvpRating, playerWon ? 1 : 0);
    const rawDelta2 = draw
      ? 0
      : ratingChange(opponent.pvpRating, character.pvpRating, oppWon ? 1 : 0);

    const delta1 = applyLossProtection(character.pvpRating, rawDelta1, character.pvpLossStreak);
    const delta2 = applyLossProtection(opponent.pvpRating, rawDelta2, opponent.pvpLossStreak);

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

    // Draw preserves streaks; win resets loss streak and vice versa
    const newWinStreak1 = draw ? character.pvpWinStreak : playerWon ? character.pvpWinStreak + 1 : 0;
    const newLossStreak1 = draw ? character.pvpLossStreak : playerWon ? 0 : character.pvpLossStreak + 1;
    const newWinStreak2 = draw ? opponent.pvpWinStreak : oppWon ? opponent.pvpWinStreak + 1 : 0;
    const newLossStreak2 = draw ? opponent.pvpLossStreak : oppWon ? 0 : opponent.pvpLossStreak + 1;

    const afterXp = character.currentXp + xp1;
    const afterGold = character.gold + gold1;
    const levelUp = applyLevelUp({
      level: character.level,
      currentXp: afterXp,
      statPointsAvailable: character.statPointsAvailable,
      gold: afterGold,
      maxHp: character.maxHp,
    });

    // All DB writes in a single transaction; re-validate stamina atomically
    await prisma.$transaction(async (tx) => {
      // Re-read character stamina inside transaction to prevent double-spend
      const freshChar = await tx.character.findUniqueOrThrow({ where: { id: character.id } });
      const freshStamina = spendStamina({
        currentStamina: freshChar.currentStamina,
        maxStamina: freshChar.maxStamina,
        lastStaminaUpdate: freshChar.lastStaminaUpdate,
        cost: STAMINA_COST.PVP,
        isVip,
      });
      if ("error" in freshStamina) {
        throw new Error(freshStamina.error);
      }

      await tx.pvpMatch.create({
        data: {
          player1Id: character.id,
          player2Id: opponent!.id,
          player1RatingBefore: character.pvpRating,
          player2RatingBefore: opponent!.pvpRating,
          player1RatingAfter: newRating1,
          player2RatingAfter: newRating2,
          // On draw winnerId/loserId are null but DB requires non-null — use player IDs as placeholders
          winnerId: winnerId ?? character.id,
          loserId: loserId ?? opponent!.id,
          combatLog: result.log as object,
          turnsTaken: result.turns,
          player1GoldReward: gold1,
          player2GoldReward: gold2,
          player1XpReward: xp1,
          player2XpReward: xp2,
          matchType: draw ? "ranked_draw" : "ranked",
          seasonNumber,
        },
      });

      // Only update highestPvpRank if the new rank is higher (GDD §6.3)
      const newRank1 = getRankFromRating(newRating1);
      const highestRank1 = rankOrder(newRank1) > rankOrder(character.highestPvpRank)
        ? newRank1
        : character.highestPvpRank;

      await tx.character.update({
        where: { id: character.id },
        data: {
          pvpRating: newRating1,
          pvpWins: { increment: playerWon ? 1 : 0 },
          pvpLosses: { increment: draw ? 0 : playerWon ? 0 : 1 },
          pvpWinStreak: newWinStreak1,
          pvpLossStreak: newLossStreak1,
          highestPvpRank: highestRank1,
          gold: levelUp.gold,
          currentXp: levelUp.currentXp,
          level: levelUp.level,
          statPointsAvailable: levelUp.statPointsAvailable,
          currentHp: levelUp.currentHp,
          currentStamina: freshStamina.newStamina,
          lastStaminaUpdate: freshStamina.newLastUpdate,
        },
      });

      const newRank2 = getRankFromRating(newRating2);
      const highestRank2 = rankOrder(newRank2) > rankOrder(opponent!.highestPvpRank)
        ? newRank2
        : opponent!.highestPvpRank;

      await tx.character.update({
        where: { id: opponent!.id },
        data: {
          pvpRating: newRating2,
          pvpWins: { increment: oppWon ? 1 : 0 },
          pvpLosses: { increment: draw ? 0 : oppWon ? 0 : 1 },
          pvpWinStreak: newWinStreak2,
          pvpLossStreak: newLossStreak2,
          highestPvpRank: highestRank2,
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
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Not enough stamina") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[api/pvp/find-match POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
