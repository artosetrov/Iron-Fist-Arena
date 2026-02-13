import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/* ────────────────── POST — Collect mining reward ────────────────── */

export const POST = async (request: Request) => {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, {
      prefix: "gold_mine_collect",
      windowMs: 3_000,
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
    const sessionId = body.sessionId as string;

    if (!characterId || !sessionId) {
      return NextResponse.json({ error: "characterId and sessionId required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.goldMineSession.findUnique({
        where: { id: sessionId },
        include: { character: { select: { id: true, userId: true } } },
      });

      if (!session) return { error: "Session not found", status: 404 } as const;
      if (session.character.userId !== user.id) return { error: "Unauthorized", status: 403 } as const;
      if (session.characterId !== characterId) return { error: "Character mismatch", status: 400 } as const;
      if (session.collected) return { error: "Already collected", status: 400 } as const;

      // Check if mining is complete
      const now = Date.now();
      if (now < session.endsAt.getTime()) {
        return { error: "Mining not finished yet", status: 400 } as const;
      }

      // Mark as collected
      await tx.goldMineSession.update({
        where: { id: sessionId },
        data: { collected: true },
      });

      // Award gold
      const character = await tx.character.update({
        where: { id: characterId },
        data: { gold: { increment: session.reward } },
        select: { gold: true },
      });

      return {
        ok: true,
        reward: session.reward,
        gold: character.gold,
        slotIndex: session.slotIndex,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/minigames/gold-mine/collect POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
