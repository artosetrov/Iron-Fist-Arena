import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  calculateReward,
  getMiningDuration,
  getMaxSlots,
  isVip,
} from "@/lib/game/minigames/gold-mine";

export const dynamic = "force-dynamic";

/* ────────────────── GET — Mining status ────────────────── */

export const GET = async (request: Request) => {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const characterId = url.searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
      select: { id: true, goldMineSlots: true, level: true, gold: true },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { gems: true, premiumUntil: true },
    });

    const sessions = await prisma.goldMineSession.findMany({
      where: { characterId, collected: false },
      orderBy: { slotIndex: "asc" },
    });

    const maxSlots = getMaxSlots(character.goldMineSlots);
    const vip = isVip(dbUser?.premiumUntil);

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        slotIndex: s.slotIndex,
        startedAt: s.startedAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        collected: s.collected,
        reward: s.reward,
        boosted: s.boosted,
        ready: Date.now() >= s.endsAt.getTime(),
      })),
      maxSlots,
      purchasedSlots: character.goldMineSlots,
      gold: character.gold,
      gems: dbUser?.gems ?? 0,
      level: character.level,
      isVip: vip,
    });
  } catch (error) {
    console.error("[api/minigames/gold-mine GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

/* ────────────────── POST — Start mining ────────────────── */

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
      prefix: "gold_mine_start",
      windowMs: 5_000,
      maxRequests: 5,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId as string;
    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: user.id },
        select: { id: true, level: true, goldMineSlots: true },
      });
      if (!character) return { error: "Character not found", status: 404 } as const;

      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { premiumUntil: true },
      });

      const maxSlots = getMaxSlots(character.goldMineSlots);

      // Count active (uncollected) sessions
      const activeSessions = await tx.goldMineSession.findMany({
        where: { characterId, collected: false },
        select: { slotIndex: true },
      });

      if (activeSessions.length >= maxSlots) {
        return { error: "All mining slots are occupied", status: 400 } as const;
      }

      // Find first available slot
      const usedSlots = new Set(activeSessions.map((s) => s.slotIndex));
      let slotIndex = -1;
      for (let i = 0; i < maxSlots; i++) {
        if (!usedSlots.has(i)) {
          slotIndex = i;
          break;
        }
      }
      if (slotIndex === -1) {
        return { error: "No available slot", status: 400 } as const;
      }

      const vip = isVip(dbUser?.premiumUntil);
      const duration = getMiningDuration(vip);
      const reward = calculateReward(character.level);
      const now = new Date();
      const endsAt = new Date(now.getTime() + duration);

      const session = await tx.goldMineSession.create({
        data: {
          characterId,
          slotIndex,
          startedAt: now,
          endsAt,
          reward,
        },
      });

      return {
        ok: true,
        session: {
          id: session.id,
          slotIndex: session.slotIndex,
          startedAt: session.startedAt.toISOString(),
          endsAt: session.endsAt.toISOString(),
          reward: session.reward,
          ready: false,
        },
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.session);
  } catch (error) {
    console.error("[api/minigames/gold-mine POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
