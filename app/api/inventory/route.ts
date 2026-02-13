import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getMaxHp } from "@/lib/game/stats";
import { applyRegen } from "@/lib/game/stamina";
import { NextResponse } from "next/server";
import {
  BASE_CRIT_CHANCE,
  MAX_CRIT_CHANCE,
  BASE_CRIT_DAMAGE,
  MAX_CRIT_DAMAGE_MULT,
  BASE_DODGE,
  MAX_DODGE,
  ARMOR_REDUCTION_CAP,
  ARMOR_DENOMINATOR,
  MAGIC_RESIST_CAP,
  MAGIC_RESIST_DENOM,
  BASE_SPELL_MULT,
} from "@/lib/game/balance";

export const dynamic = "force-dynamic";

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
      include: {
        user: true,
        equipment: { include: { item: true } },
      },
    });
    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const equipped = character.equipment.filter((e) => e.isEquipped);
    const unequipped = character.equipment.filter((e) => !e.isEquipped);

    // Apply stamina regen
    const lastUpdate =
      character.lastStaminaUpdate instanceof Date
        ? character.lastStaminaUpdate
        : new Date(character.lastStaminaUpdate);
    const { currentStamina, lastStaminaUpdate } = applyRegen({
      currentStamina: character.currentStamina,
      maxStamina: character.maxStamina,
      lastStaminaUpdate: lastUpdate,
      isVip: !!character.user?.premiumUntil && character.user.premiumUntil > new Date(),
    });
    if (currentStamina !== character.currentStamina || lastStaminaUpdate.getTime() !== lastUpdate.getTime()) {
      await prisma.character.update({
        where: { id: character.id },
        data: { currentStamina, lastStaminaUpdate },
      });
    }

    // Derived stats per GDD §2
    const str = character.strength;
    const agi = character.agility;
    const vit = character.vitality;
    const end = character.endurance;
    const int = character.intelligence;
    const wis = character.wisdom;
    const lck = character.luck;
    const cha = character.charisma;

    const maxHp = getMaxHp(vit);
    const critChance = Math.min(MAX_CRIT_CHANCE, BASE_CRIT_CHANCE + agi / 10 + lck / 15);
    const critDamage = Math.min(MAX_CRIT_DAMAGE_MULT, BASE_CRIT_DAMAGE + str / 500);
    const dodgeChance = Math.min(MAX_DODGE, BASE_DODGE + agi / 8);
    const armorReduction = Math.min(ARMOR_REDUCTION_CAP, character.armor / (character.armor + ARMOR_DENOMINATOR));
    const magicResist = Math.min(MAGIC_RESIST_CAP, wis / (wis + MAGIC_RESIST_DENOM));

    // GDD §2.1: avg damage = base × (1 + critChance% × (critMult - 1))
    const critFactor = 1 + (critChance / 100) * (critDamage - 1);
    const physicalDamage = Math.floor(str * critFactor);
    const magicDamage = Math.floor(int * BASE_SPELL_MULT * critFactor);

    return NextResponse.json({
      characterId,
      character: {
        id: character.id,
        characterName: character.characterName,
        class: character.class,
        origin: character.origin,
        level: character.level,
        currentXp: character.currentXp,
        prestigeLevel: character.prestigeLevel,
        gold: character.gold,
        maxHp: character.maxHp,
        currentHp: character.currentHp,
        armor: character.armor,
        magicResist: character.magicResist,
        pvpRating: character.pvpRating,
        pvpWins: character.pvpWins,
        pvpLosses: character.pvpLosses,
        statPointsAvailable: character.statPointsAvailable,
        currentStamina,
        maxStamina: character.maxStamina,
        stats: { str, agi, vit, end, int, wis, lck, cha },
        derived: {
          physicalDamage,
          magicDamage,
          defense: end,
          magicDefense: wis,
          critChance: Math.round(critChance * 100) / 100,
          critDamage: Math.round(critDamage * 100) / 100,
          dodgeChance: Math.round(dodgeChance * 100) / 100,
          armorReduction: Math.round(armorReduction * 10000) / 100,
          magicResistPercent: Math.round(magicResist * 10000) / 100,
          maxHp,
        },
      },
      equipped,
      unequipped,
      items: character.equipment,
      slots: equipped,
    });
  } catch (error) {
    console.error("[api/inventory GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
