import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(authUser.id, {
      prefix: "rush-abandon",
      windowMs: 10_000,
      maxRequests: 5,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    if (!characterId) {
      return NextResponse.json(
        { error: "characterId required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: authUser.id },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    const activeRun = await prisma.dungeonRun.findFirst({
      where: { characterId, difficulty: "dungeon_rush" },
    });
    if (!activeRun) {
      return NextResponse.json({ message: "No active run to abandon" });
    }

    await prisma.dungeonRun.delete({ where: { id: activeRun.id } });

    return NextResponse.json({ message: "Run abandoned" });
  } catch (error) {
    console.error("[api/dungeon-rush/abandon POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
