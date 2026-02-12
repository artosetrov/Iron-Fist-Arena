import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import { aggregateEquipmentStats } from "@/lib/game/equipment-stats";
import type { DungeonRunState } from "@/app/api/dungeons/start/route";
import {
  getDungeonById,
  getBossStats,
  getBossGoldReward,
  getBossXpReward,
  getDungeonCompletionBonus,
  BOSSES_PER_DUNGEON,
  DUNGEONS,
} from "@/lib/game/dungeon";
import { getBossCatalogEntry } from "@/lib/game/boss-catalog";
import {
  rollRarity,
  rollDropChance,
  rollItemType,
  generateItemStats,
  generateItemName,
} from "@/lib/game/loot";
import type { CharacterClass, CharacterOrigin } from "@prisma/client";
import { Rarity } from "@prisma/client";
import { applyLevelUp } from "@/lib/game/levelUp";
import { updateDailyQuestProgress } from "@/lib/game/quests";
import { ratingForBossKill, ratingForDungeonComplete, getRankFromRating, rankOrder } from "@/lib/game/elo";
import {
  BUY_RARITY_PRICE_MULT,
  BUY_BASE_MULT,
  ITEM_LEVEL_VARIANCE_MIN,
  ITEM_LEVEL_VARIANCE_RANGE,
} from "@/lib/game/balance";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(authUser.id, { prefix: "dungeon-fight", windowMs: 5_000, maxRequests: 5 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const { id: runId } = await params;
    const run = await prisma.dungeonRun.findFirst({
      where: { id: runId },
      include: {
        character: {
          include: {
            equipment: { where: { isEquipped: true }, include: { item: true } },
          },
        },
      },
    });
    if (!run || run.character.userId !== authUser.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const state = run.state as unknown as DungeonRunState;
    const character = run.character;
    const dungeon = getDungeonById(state.dungeonId);
    if (!dungeon) {
      return NextResponse.json(
        { error: "Dungeon data not found" },
        { status: 500 }
      );
    }

    // Build player combatant with equipment bonuses
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

    // Build boss combatant
    const bs = state.bossStats;
    const enemyState = buildCombatantState({
      id: "boss",
      name: bs.name,
      class: "warrior",
      level: character.level,
      strength: bs.strength,
      agility: bs.agility,
      vitality: bs.vitality,
      endurance: bs.endurance,
      intelligence: bs.intelligence,
      wisdom: bs.wisdom,
      luck: bs.luck,
      charisma: bs.charisma,
      armor: bs.armor,
    });
    enemyState.currentHp = state.bossCurrentHp;
    enemyState.maxHp = bs.maxHp;

    // Attach boss abilities from catalog
    const catalogEntry = getBossCatalogEntry(state.dungeonId, state.bossIndex);
    if (catalogEntry) {
      enemyState.bossAbilityIds = catalogEntry.abilityIds;
    }

    const result = runCombat(playerState, enemyState, []);

    // DEFEAT — delete run, return result
    if (result.winnerId !== character.id) {
      await prisma.dungeonRun.delete({ where: { id: runId } });
      return NextResponse.json({
        victory: false,
        log: result.log,
        playerSnapshot: result.playerSnapshot,
        enemySnapshot: result.enemySnapshot,
        message: "Defeat",
      });
    }

    // VICTORY — calculate rewards
    const dungeonIndex = DUNGEONS.findIndex((d) => d.id === state.dungeonId);
    const goldEarned = getBossGoldReward(
      Math.max(0, dungeonIndex),
      state.bossIndex
    );
    const xpEarned = getBossXpReward(
      Math.max(0, dungeonIndex),
      state.bossIndex
    );

    // Rating reward based on boss level
    const currentBoss = dungeon.bosses[state.bossIndex];
    const bossLevel = currentBoss?.level ?? 1;
    const ratingEarned = ratingForBossKill(bossLevel);

    state.rewards.gold += goldEarned;
    state.rewards.xp += xpEarned;

    // Loot roll
    const difficultyForLoot =
      dungeonIndex <= 1 ? "easy" : dungeonIndex <= 4 ? "normal" : "hard";
    const isBoss = true;
    const droppedItem =
      rollDropChance(difficultyForLoot, isBoss) &&
      (() => {
        const rarity = rollRarity(character.luck, difficultyForLoot);
        return { rarity, bossIndex: state.bossIndex };
      })();

    const nextBossIndex = state.bossIndex + 1;
    const dungeonComplete = nextBossIndex >= dungeon.bosses.length;

    // Apply completion bonus
    let completionRatingBonus = 0;
    if (dungeonComplete) {
      const bonus = getDungeonCompletionBonus(Math.max(0, dungeonIndex));
      state.rewards.gold += bonus.gold;
      state.rewards.xp += bonus.xp;
      completionRatingBonus = ratingForDungeonComplete(dungeon.minLevel);
    }

    const totalRatingEarned = ratingEarned + completionRatingBonus;

    let newItemId: string | null = null;
    let droppedItemType: string | null = null;
    await prisma.$transaction(async (tx) => {
      // Handle dropped item
      if (droppedItem) {
        const itemLevel = Math.max(
          1,
          character.level + Math.floor(Math.random() * ITEM_LEVEL_VARIANCE_RANGE) + ITEM_LEVEL_VARIANCE_MIN
        );
        const rarity = droppedItem.rarity as Rarity;
        const itemType = rollItemType();
        droppedItemType = itemType;

        let item = await tx.item.findFirst({
          where: {
            rarity,
            itemType,
            itemLevel: { gte: itemLevel - 1, lte: itemLevel + 1 },
          },
        });
        if (!item) {
          const baseStats = generateItemStats(itemType, rarity);
          const rarityPriceMultiplier = BUY_RARITY_PRICE_MULT[rarity] ?? 1;

          item = await tx.item.create({
            data: {
              itemName: generateItemName(itemType, rarity, dungeon.name),
              itemType,
              rarity,
              itemLevel,
              baseStats,
              buyPrice: itemLevel * BUY_BASE_MULT * rarityPriceMultiplier,
            },
          });
        }
        const inv = await tx.equipmentInventory.create({
          data: { characterId: character.id, itemId: item.id },
        });
        newItemId = inv.id;
      }

      // Update dungeon progress
      await tx.dungeonProgress.upsert({
        where: {
          characterId_dungeonId: {
            characterId: character.id,
            dungeonId: state.dungeonId,
          },
        },
        create: {
          characterId: character.id,
          dungeonId: state.dungeonId,
          bossIndex: nextBossIndex,
          completed: dungeonComplete,
        },
        update: {
          bossIndex: nextBossIndex,
          completed: dungeonComplete,
        },
      });

      // Rating update (same for both paths)
      const newRating = character.pvpRating + totalRatingEarned;
      const newRank = getRankFromRating(newRating);
      const highestRank = rankOrder(newRank) > rankOrder(character.highestPvpRank)
        ? newRank
        : character.highestPvpRank;

      if (dungeonComplete) {
        // Apply total rewards
        const levelUp = applyLevelUp({
          level: character.level,
          currentXp: character.currentXp + state.rewards.xp,
          statPointsAvailable: character.statPointsAvailable,
          gold: character.gold + state.rewards.gold,
          maxHp: character.maxHp,
        });
        await tx.character.update({
          where: { id: character.id },
          data: {
            gold: levelUp.gold,
            currentXp: levelUp.currentXp,
            level: levelUp.level,
            statPointsAvailable: levelUp.statPointsAvailable,
            currentHp: levelUp.currentHp,
            pvpRating: newRating,
            highestPvpRank: highestRank,
          },
        });
        await tx.dungeonRun.delete({ where: { id: runId } });
      } else {
        // Give gold/xp per boss immediately + check level-up
        const bossLevelUp = applyLevelUp({
          level: character.level,
          currentXp: character.currentXp + xpEarned,
          statPointsAvailable: character.statPointsAvailable,
          gold: character.gold + goldEarned,
          maxHp: character.maxHp,
        });
        await tx.character.update({
          where: { id: character.id },
          data: {
            gold: bossLevelUp.gold,
            currentXp: bossLevelUp.currentXp,
            level: bossLevelUp.level,
            statPointsAvailable: bossLevelUp.statPointsAvailable,
            currentHp: bossLevelUp.currentHp,
            pvpRating: newRating,
            highestPvpRank: highestRank,
          },
        });
        await tx.dungeonRun.delete({ where: { id: runId } });
      }
    });

    if (dungeonComplete) {
      await updateDailyQuestProgress(character.id, "dungeons_complete", 1);
    }

    if (dungeonComplete) {
      return NextResponse.json({
        victory: true,
        dungeonComplete: true,
        log: result.log,
        playerSnapshot: result.playerSnapshot,
        enemySnapshot: result.enemySnapshot,
        rewards: state.rewards,
        goldEarned,
        xpEarned,
        ratingEarned: totalRatingEarned,
        droppedItem: droppedItem
          ? { itemId: newItemId, rarity: droppedItem.rarity, itemType: droppedItemType }
          : null,
        bossIndex: state.bossIndex,
        dungeonName: dungeon.name,
      });
    }

    return NextResponse.json({
      victory: true,
      dungeonComplete: false,
      log: result.log,
      playerSnapshot: result.playerSnapshot,
      enemySnapshot: result.enemySnapshot,
      goldEarned,
      xpEarned,
      ratingEarned: totalRatingEarned,
      droppedItem: droppedItem
        ? { itemId: newItemId, rarity: droppedItem.rarity, itemType: droppedItemType }
        : null,
      bossIndex: state.bossIndex,
      nextBossIndex,
      dungeonName: dungeon.name,
    });
  } catch (error) {
    console.error("[api/dungeons/run/fight POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
