import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { CharacterClass, CharacterOrigin } from "@prisma/client";
import { Prisma } from "@prisma/client";

async function ensureUserExists(
  authUserId: string,
  email: string,
  username: string,
  authProvider: string
): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: authUserId },
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

    await ensureUserExists(
      user.id,
      user.email ?? "",
      user.user_metadata?.username ?? user.email?.split("@")[0] ?? "player",
      user.app_metadata?.provider ?? "email"
    );

    const body = await request.json().catch(() => ({}));
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
        gold: 500,
        currentStamina: 100,
        maxStamina: 100,
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
