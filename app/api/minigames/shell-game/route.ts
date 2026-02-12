import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateShellGame,
  validateBet,
  validateCupChoice,
  SHELL_GAME_MULTIPLIER,
  type ShellGameSecret,
} from "@/lib/game/minigames/shell-game";

export const dynamic = "force-dynamic";

/* ────────────────── POST — Start a new shell game ────────────────── */

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
      prefix: "minigame_shell",
      windowMs: 3_000,
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
    const betAmount = Number(body.betAmount);

    if (!characterId) {
      return NextResponse.json({ error: "characterId required" }, { status: 400 });
    }

    const betCheck = validateBet(betAmount);
    if (!betCheck.valid) {
      return NextResponse.json({ error: betCheck.reason }, { status: 400 });
    }

    const secret = generateShellGame();

    const result = await prisma.$transaction(async (tx) => {
      // Cancel any lingering active sessions for this character
      await tx.minigameSession.updateMany({
        where: { characterId, status: "active", gameType: "shell_game" },
        data: { status: "completed", result: "abandoned" },
      });

      const character = await tx.character.findFirst({
        where: { id: characterId, userId: user.id },
      });
      if (!character) return { error: "Character not found", status: 404 } as const;

      if (character.gold < betAmount) {
        return { error: "Not enough gold", status: 400 } as const;
      }

      // Freeze bet: decrement gold immediately
      await tx.character.update({
        where: { id: characterId },
        data: { gold: { decrement: betAmount } },
      });

      const session = await tx.minigameSession.create({
        data: {
          characterId,
          gameType: "shell_game",
          betAmount,
          secretData: JSON.stringify(secret),
          status: "active",
        },
      });

      return { ok: true, session } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Return shuffle sequence to client (without revealing the answer)
    return NextResponse.json({
      gameId: result.session.id,
      initialPosition: secret.initialPosition,
      swaps: secret.swaps,
      betAmount,
    });
  } catch (error) {
    console.error("[api/minigames/shell-game POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

/* ────────────────── PUT — Submit cup choice ────────────────── */

export const PUT = async (request: Request) => {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, {
      prefix: "minigame_shell_pick",
      windowMs: 2_000,
      maxRequests: 5,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const gameId = body.gameId as string;
    const chosenCup = Number(body.chosenCup);

    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    if (!validateCupChoice(chosenCup)) {
      return NextResponse.json({ error: "Invalid cup choice (0-2)" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.minigameSession.findUnique({
        where: { id: gameId },
        include: { character: { select: { id: true, userId: true } } },
      });

      if (!session) return { error: "Game not found", status: 404 } as const;
      if (session.character.userId !== user.id) return { error: "Unauthorized", status: 403 } as const;
      if (session.status !== "active") return { error: "Game already completed", status: 400 } as const;

      const secret: ShellGameSecret = JSON.parse(session.secretData);
      const isWin = chosenCup === secret.finalPosition;
      const goldChange = isWin ? session.betAmount * SHELL_GAME_MULTIPLIER : 0;

      // Update session
      await tx.minigameSession.update({
        where: { id: gameId },
        data: { status: "completed", result: isWin ? "win" : "lose" },
      });

      // If win: return bet + profit
      if (goldChange > 0) {
        await tx.character.update({
          where: { id: session.characterId },
          data: { gold: { increment: goldChange } },
        });
      }

      return {
        ok: true,
        result: isWin ? "win" : "lose",
        correctCup: secret.finalPosition,
        chosenCup,
        goldChange: isWin ? session.betAmount : -session.betAmount,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/minigames/shell-game PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
