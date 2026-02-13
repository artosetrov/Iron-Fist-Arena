import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { GOLD_MINE_BOOST_COST_GEMS } from "@/lib/game/balance";

export const dynamic = "force-dynamic";

/* ────────────────── POST — Boost (instant complete) ────────────────── */

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
      prefix: "gold_mine_boost",
      windowMs: 5_000,
      maxRequests: 3,
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

      // Already finished — no need to boost
      if (Date.now() >= session.endsAt.getTime()) {
        return { error: "Mining already complete, just collect it", status: 400 } as const;
      }

      // Check gems
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { gems: true },
      });
      if (!dbUser || dbUser.gems < GOLD_MINE_BOOST_COST_GEMS) {
        return { error: `Not enough gems (need ${GOLD_MINE_BOOST_COST_GEMS})`, status: 400 } as const;
      }

      // Deduct gems
      await tx.user.update({
        where: { id: user.id },
        data: { gems: { decrement: GOLD_MINE_BOOST_COST_GEMS } },
      });

      // Set endsAt to now and mark boosted
      const now = new Date();
      await tx.goldMineSession.update({
        where: { id: sessionId },
        data: { endsAt: now, boosted: true },
      });

      return {
        ok: true,
        slotIndex: session.slotIndex,
        gemsSpent: GOLD_MINE_BOOST_COST_GEMS,
        gemsRemaining: dbUser.gems - GOLD_MINE_BOOST_COST_GEMS,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/minigames/gold-mine/boost POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
