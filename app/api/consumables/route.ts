import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get("characterId");

    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    // Verify ownership
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
      select: { id: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const consumables = await prisma.consumableInventory.findMany({
      where: { characterId, quantity: { gt: 0 } },
      select: {
        consumableType: true,
        quantity: true,
      },
    });

    return NextResponse.json({ consumables });
  } catch (error) {
    console.error("[api/consumables GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
