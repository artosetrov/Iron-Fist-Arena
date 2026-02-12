import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getMaxHp } from "@/lib/game/stats";
import { NextResponse } from "next/server";

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
        equipment: { include: { item: true } },
      },
    });
    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const equipped = character.equipment.filter((e) => e.isEquipped);
    const unequipped = character.equipment.filter((e) => !e.isEquipped);

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
    const critChance = Math.min(50, 5 + agi / 10 + lck / 15);
    const critDamage = Math.min(2.8, 1.5 + str / 500);
    const dodgeChance = Math.min(40, 3 + agi / 8);
    const armorReduction = Math.min(0.75, character.armor / (character.armor + 100));
    const magicResist = Math.min(0.7, wis / (wis + 150));

    // GDD §2.1: avg damage = base × (1 + critChance% × (critMult - 1))
    const critFactor = 1 + (critChance / 100) * (critDamage - 1);
    const physicalDamage = Math.floor(str * critFactor);
    const magicDamage = Math.floor(int * 1.2 * critFactor); // base spell mult 1.2

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
