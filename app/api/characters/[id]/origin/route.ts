import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { CharacterOrigin } from "@prisma/client";
import { ORIGIN_CHANGE_COST } from "@/lib/game/origins";

export const dynamic = "force-dynamic";

const VALID_ORIGINS: CharacterOrigin[] = [
  "human",
  "orc",
  "skeleton",
  "demon",
  "dogfolk",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: characterId } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const originRaw = body?.origin as string;

    if (!VALID_ORIGINS.includes(originRaw as CharacterOrigin)) {
      return NextResponse.json(
        { error: "Invalid origin" },
        { status: 400 }
      );
    }

    const newOrigin = originRaw as CharacterOrigin;

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    if (character.origin === newOrigin) {
      return NextResponse.json(
        { error: "Already this origin" },
        { status: 400 }
      );
    }

    if (character.gold < ORIGIN_CHANGE_COST) {
      return NextResponse.json(
        { error: `Not enough gold. Need ${ORIGIN_CHANGE_COST}, have ${character.gold}` },
        { status: 400 }
      );
    }

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: {
        origin: newOrigin,
        gold: { decrement: ORIGIN_CHANGE_COST },
      },
    });

    return NextResponse.json({
      character: {
        id: updated.id,
        origin: updated.origin,
        gold: updated.gold,
      },
      cost: ORIGIN_CHANGE_COST,
    });
  } catch (err) {
    console.error("[api/characters/[id]/origin PATCH]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
