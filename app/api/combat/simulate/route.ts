import { NextResponse } from "next/server";
import { runCombat, buildCombatantState } from "@/lib/game/combat";
import type { CombatantState } from "@/lib/game/types";

/** Preset test opponents (GDD-style stat blocks) */
const PRESET_OPPONENTS: Record<
  string,
  { name: string; class: "warrior" | "rogue" | "mage" | "tank"; level: number; stats: Record<string, number> }
> = {
  warrior: {
    name: "Test Warrior",
    class: "warrior",
    level: 10,
    stats: { strength: 85, agility: 20, vitality: 40, endurance: 25, intelligence: 10, wisdom: 10, luck: 10, charisma: 10, armor: 50 },
  },
  rogue: {
    name: "Test Rogue",
    class: "rogue",
    level: 10,
    stats: { strength: 50, agility: 75, vitality: 30, endurance: 20, intelligence: 10, wisdom: 10, luck: 40, charisma: 10, armor: 30 },
  },
  mage: {
    name: "Test Mage",
    class: "mage",
    level: 10,
    stats: { strength: 10, agility: 25, vitality: 35, endurance: 10, intelligence: 90, wisdom: 50, luck: 20, charisma: 10, armor: 20 },
  },
  tank: {
    name: "Test Tank",
    class: "tank",
    level: 10,
    stats: { strength: 35, agility: 25, vitality: 60, endurance: 55, intelligence: 10, wisdom: 20, luck: 10, charisma: 10, armor: 80 },
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const playerData = body.player as {
      id: string;
      name: string;
      class: "warrior" | "rogue" | "mage" | "tank";
      level: number;
      strength: number;
      agility: number;
      vitality: number;
      endurance: number;
      intelligence: number;
      wisdom: number;
      luck: number;
      charisma: number;
      armor?: number;
    };
    const opponentPreset = body.opponentPreset as string;
    const playerChoices = (body.playerChoices as ("basic" | string)[]) ?? [];

    if (!playerData?.id || !playerData?.name || !playerData?.class || !playerData?.level) {
      return NextResponse.json(
        { error: "player.id, player.name, player.class, player.level required" },
        { status: 400 }
      );
    }

    const player: CombatantState = buildCombatantState({
      id: playerData.id,
      name: playerData.name,
      class: playerData.class,
      level: playerData.level,
      strength: playerData.strength ?? 10,
      agility: playerData.agility ?? 10,
      vitality: playerData.vitality ?? 10,
      endurance: playerData.endurance ?? 10,
      intelligence: playerData.intelligence ?? 10,
      wisdom: playerData.wisdom ?? 10,
      luck: playerData.luck ?? 10,
      charisma: playerData.charisma ?? 10,
      armor: playerData.armor ?? 0,
    });

    const preset = opponentPreset && PRESET_OPPONENTS[opponentPreset]
      ? PRESET_OPPONENTS[opponentPreset]
      : PRESET_OPPONENTS.warrior;
    const s = preset.stats;
    const enemy: CombatantState = buildCombatantState({
      id: "enemy",
      name: preset.name,
      class: preset.class,
      level: preset.level,
      strength: s.strength ?? 10,
      agility: s.agility ?? 10,
      vitality: s.vitality ?? 10,
      endurance: s.endurance ?? 10,
      intelligence: s.intelligence ?? 10,
      wisdom: s.wisdom ?? 10,
      luck: s.luck ?? 10,
      charisma: s.charisma ?? 10,
      armor: s.armor ?? 0,
    });

    const result = runCombat(player, enemy, playerChoices);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/combat/simulate POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
