import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { GOLD_PACKAGES, type GoldPackageId } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId as string;
    const packageId = body.packageId as string;

    if (!characterId || !packageId) {
      return NextResponse.json(
        { error: "characterId, packageId required" },
        { status: 400 }
      );
    }

    const pkg = GOLD_PACKAGES[packageId as GoldPackageId];
    if (!pkg) {
      return NextResponse.json(
        { error: "Invalid package" },
        { status: 400 }
      );
    }

    // NOTE: In production, validate payment token from Stripe/etc here
    // For now this is a simulated purchase (no real payment processing)

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: { gold: { increment: pkg.gold } },
      select: { gold: true },
    });

    return NextResponse.json({
      ok: true,
      goldAdded: pkg.gold,
      newBalance: updated.gold,
    });
  } catch (error) {
    console.error("[api/shop/buy-gold POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
