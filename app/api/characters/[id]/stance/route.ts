import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateStance, defaultStance } from "@/lib/game/body-zones";
import type { CombatStance } from "@/lib/game/types";

export const dynamic = "force-dynamic";

/** GET /api/characters/[id]/stance — get character's saved combat stance */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const character = await prisma.character.findFirst({
      where: { id, userId: authUser.id },
      select: { combatStance: true },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const stance = (character.combatStance as CombatStance | null) ?? defaultStance();

    return NextResponse.json({ stance });
  } catch (err) {
    console.error("[GET /stance]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PUT /api/characters/[id]/stance — save combat stance as default */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const stance = body.stance as CombatStance;
    const validationError = validateStance(stance);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id, userId: authUser.id },
      select: { id: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    await prisma.character.update({
      where: { id },
      data: { combatStance: JSON.parse(JSON.stringify(stance)) },
    });

    return NextResponse.json({ success: true, stance });
  } catch (err) {
    console.error("[PUT /stance]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
