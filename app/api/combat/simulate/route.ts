import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { applyLevelUp } from "@/lib/game/levelUp";
import { aggregateEquipmentStats } from "@/lib/game/equipment-stats";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  TRAINING_MAX_DAILY,
  TRAINING_XP_BASE,
  TRAINING_XP_PER_LEVEL,
  TRAINING_DUMMY_LEVEL_OFFSET,
  TRAINING_DUMMY_STAT_MULT,
} from "@/lib/game/balance";
import { DUMMY_CLASS_WEIGHTS } from "@/lib/game/training-dummies";
import type { CharacterClass, CharacterOrigin } from "@prisma/client";
import { startOfTodayUTC } from "@/lib/game/date-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    /* ── Auth ── */
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(authUser.id, { prefix: "training", windowMs: 10_000, maxRequests: 5 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    /* ── Parse body ── */
    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    const opponentPreset = (body.opponentPreset as string) ?? "warrior";

    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    /* ── Load character ── */
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      include: {
        equipment: { where: { isEquipped: true }, include: { item: true } },
      },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    /* ── Build player combatant ── */
    const playerEqStats = aggregateEquipmentStats(character.equipment ?? [], character.class);
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
    });

    /* ── Validate opponent preset ── */
    const validPresets = Object.keys(DUMMY_CLASS_WEIGHTS);
    const safePreset = validPresets.includes(opponentPreset) ? opponentPreset : "warrior";

    /* ── Build training dummy ── */
    const preset = DUMMY_CLASS_WEIGHTS[safePreset];
    const mult = TRAINING_DUMMY_STAT_MULT;
    const dummyLevel = Math.max(1, character.level + TRAINING_DUMMY_LEVEL_OFFSET);

    const scaleStat = (base: number, weight: number) =>
      Math.max(5, Math.floor(base * mult * weight));

    const dummyState = buildCombatantState({
      id: "training-dummy",
      name: preset.name,
      class: preset.class,
      level: dummyLevel,
      strength: scaleStat(character.strength, preset.strW),
      agility: scaleStat(character.agility, preset.agiW),
      vitality: scaleStat(character.vitality, preset.vitW),
      endurance: scaleStat(character.endurance, preset.endW),
      intelligence: scaleStat(character.intelligence, preset.intW),
      wisdom: scaleStat(character.wisdom, preset.wisW),
      luck: scaleStat(character.luck, preset.lckW),
      charisma: scaleStat(character.charisma, preset.chaW),
      armor: Math.floor(character.armor * mult),
    });

    /* ── Run combat ── */
    const combatResult = runCombat(playerState, dummyState, []);
    const playerWon = combatResult.winnerId === character.id;

    /* ── Calculate XP: awarded on win only ── */
    const xpAwarded = playerWon
      ? TRAINING_XP_BASE + character.level * TRAINING_XP_PER_LEVEL
      : 0;

    /* ── Apply XP + level-up ── */
    const levelUp = applyLevelUp({
      level: character.level,
      currentXp: character.currentXp + xpAwarded,
      statPointsAvailable: character.statPointsAvailable,
      gold: character.gold,
      maxHp: character.maxHp,
    });
    const leveledUp = levelUp.level > character.level;

    /* ── Persist in a transaction (daily limit check is INSIDE to prevent race conditions) ── */
    const todayStart = startOfTodayUTC();
    const txResult = await prisma.$transaction(async (tx) => {
      /* Re-fetch character for bonus trainings (inside tx for consistency) */
      const charBonus = await tx.character.findUnique({
        where: { id: character.id },
        select: { bonusTrainings: true, bonusTrainingsDate: true },
      });

      const isToday =
        charBonus?.bonusTrainingsDate &&
        charBonus.bonusTrainingsDate.getTime() === todayStart.getTime();
      const bonus = isToday ? (charBonus?.bonusTrainings ?? 0) : 0;
      const totalMax = TRAINING_MAX_DAILY + bonus;

      const todayCount = await tx.trainingSession.count({
        where: { characterId: character.id, playedAt: { gte: todayStart } },
      });
      if (todayCount >= totalMax) {
        return { limitReached: true as const, remaining: 0 };
      }

      await tx.trainingSession.create({
        data: {
          characterId: character.id,
          xpAwarded,
          won: playerWon,
          turns: combatResult.turns,
          opponentType: safePreset,
        },
      });

      if (xpAwarded > 0) {
        await tx.character.update({
          where: { id: character.id },
          data: {
            currentXp: levelUp.currentXp,
            level: levelUp.level,
            statPointsAvailable: levelUp.statPointsAvailable,
            gold: levelUp.gold,
            currentHp: levelUp.currentHp,
          },
        });
      }

      return { limitReached: false as const, remaining: totalMax - todayCount - 1 };
    });

    if (txResult.limitReached) {
      return NextResponse.json(
        { error: "Daily training limit reached", remaining: 0 },
        { status: 429 },
      );
    }

    const remaining = txResult.remaining;

    return NextResponse.json({
      ...combatResult,
      rewards: {
        xp: xpAwarded,
        remaining,
        leveledUp,
      },
    });
  } catch (error) {
    console.error("[api/combat/simulate POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
