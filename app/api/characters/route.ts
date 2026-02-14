import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { CharacterClass, CharacterOrigin } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { STARTING_GOLD, STARTING_STAMINA, STARTING_MAX_STAMINA } from "@/lib/game/balance";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function ensureUserExists(
  authUserId: string,
  email: string,
  username: string,
  authProvider: string
): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: authUserId },
    select: { id: true },
  });
  if (existing) return;
  const safeId = authUserId.replace(/-/g, "_");
  const uniqueEmail = email?.trim() || `user-${safeId}@placeholder.local`;
  const uniqueUsername = username?.trim() || `user_${safeId}`;
  try {
    await prisma.user.create({
      data: {
        id: authUserId,
        email: uniqueEmail,
        username: uniqueUsername,
        authProvider,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      try {
        await prisma.user.create({
          data: {
            id: authUserId,
            email: `user-${safeId}@placeholder.local`,
            username: `user_${safeId}`,
            authProvider,
          },
        });
      } catch (retryErr) {
        if (
          retryErr instanceof Prisma.PrismaClientKnownRequestError &&
          retryErr.code === "P2002"
        ) {
          return;
        }
        throw retryErr;
      }
      return;
    }
    throw e;
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      orderBy: { lastPlayed: "desc" },
      select: {
        id: true,
        characterName: true,
        class: true,
        origin: true,
        level: true,
        currentXp: true,
        prestigeLevel: true,
        statPointsAvailable: true,
        strength: true,
        agility: true,
        vitality: true,
        endurance: true,
        intelligence: true,
        wisdom: true,
        luck: true,
        charisma: true,
        gold: true,
        arenaTokens: true,
        maxHp: true,
        currentHp: true,
        armor: true,
        magicResist: true,
        currentStamina: true,
        maxStamina: true,
        lastStaminaUpdate: true,
        pvpRating: true,
        pvpWins: true,
        pvpLosses: true,
        pvpWinStreak: true,
        pvpLossStreak: true,
        highestPvpRank: true,
        lastPlayed: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ characters });
  } catch (err) {
    console.error("[api/characters GET]", err);
    const rawMessage = err instanceof Error ? err.message : String(err);
    const message =
      process.env.NODE_ENV === "development" ? rawMessage : "Failed to load characters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { prefix: "create-char", windowMs: 60_000, maxRequests: 3 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await ensureUserExists(
      user.id,
      user.email ?? "",
      user.user_metadata?.username ?? user.email?.split("@")[0] ?? "player",
      user.app_metadata?.provider ?? "email"
    );

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterName = String(body?.characterName ?? "").trim();
    const classRaw = body?.class as string;
    const originRaw = body?.origin as string;

    const validClasses: CharacterClass[] = ["warrior", "rogue", "mage", "tank"];
    const characterClass = validClasses.includes(classRaw as CharacterClass)
      ? (classRaw as CharacterClass)
      : "warrior";

    const validOrigins: CharacterOrigin[] = [
      "human",
      "orc",
      "skeleton",
      "demon",
      "dogfolk",
    ];
    const characterOrigin = validOrigins.includes(originRaw as CharacterOrigin)
      ? (originRaw as CharacterOrigin)
      : "human";

    if (!characterName || characterName.length < 2) {
      return NextResponse.json(
        { error: "Character name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.character.findUnique({
      where: { characterName },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This name is already taken" },
        { status: 400 }
      );
    }

    const character = await prisma.character.create({
      data: {
        userId: user.id,
        characterName,
        class: characterClass,
        origin: characterOrigin,
        gold: STARTING_GOLD,
        currentStamina: STARTING_STAMINA,
        maxStamina: STARTING_MAX_STAMINA,
      },
    });
    return NextResponse.json({ character });
  } catch (err) {
    console.error("[api/characters POST]", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Character creation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
