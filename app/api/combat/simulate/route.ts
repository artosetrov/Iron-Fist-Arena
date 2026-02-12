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
import type { CharacterClass, CharacterOrigin } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Class-flavored base stats for training dummies — later scaled by player stats */
const DUMMY_CLASS_WEIGHTS: Record<string, {
  class: "warrior" | "rogue" | "mage" | "tank";
  name: string;
  strW: number; agiW: number; vitW: number; endW: number;
  intW: number; wisW: number; lckW: number; chaW: number;
}> = {
  warrior: { class: "warrior", name: "Training Dummy — Warrior", strW: 1.4, agiW: 0.6, vitW: 1.0, endW: 0.8, intW: 0.3, wisW: 0.3, lckW: 0.5, chaW: 0.3 },
  rogue:   { class: "rogue",   name: "Training Dummy — Rogue",   strW: 0.8, agiW: 1.4, vitW: 0.6, endW: 0.5, intW: 0.3, wisW: 0.3, lckW: 1.2, chaW: 0.3 },
  mage:    { class: "mage",    name: "Training Dummy — Mage",    strW: 0.3, agiW: 0.6, vitW: 0.7, endW: 0.3, intW: 1.5, wisW: 1.0, lckW: 0.5, chaW: 0.3 },
  tank:    { class: "tank",    name: "Training Dummy — Tank",     strW: 0.7, agiW: 0.4, vitW: 1.3, endW: 1.2, intW: 0.3, wisW: 0.5, lckW: 0.3, chaW: 0.3 },
};

/** Get start of today (UTC) */
const startOfTodayUTC = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

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
    const body = await request.json().catch(() => ({}));
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

    /* ── Daily limit check ── */
    const todayStart = startOfTodayUTC();
    const todayCount = await prisma.trainingSession.count({
      where: { characterId: character.id, playedAt: { gte: todayStart } },
    });
    if (todayCount >= TRAINING_MAX_DAILY) {
      return NextResponse.json(
        { error: "Daily training limit reached", remaining: 0 },
        { status: 429 },
      );
    }

    /* ── Build player combatant ── */
    const playerEqStats = aggregateEquipmentStats(character.equipment ?? []);
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

    /* ── Build training dummy ── */
    const preset = DUMMY_CLASS_WEIGHTS[opponentPreset] ?? DUMMY_CLASS_WEIGHTS.warrior;
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

    /* ── Persist in a transaction ── */
    await prisma.$transaction(async (tx) => {
      await tx.trainingSession.create({
        data: {
          characterId: character.id,
          xpAwarded,
          won: playerWon,
          turns: combatResult.turns,
          opponentType: opponentPreset,
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
    });

    const remaining = TRAINING_MAX_DAILY - todayCount - 1;

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
