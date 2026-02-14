import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const requireAdmin = async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== "admin") return null;
  return user;
};

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, { prefix: "admin-chars", maxRequests: 60 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const charClass = searchParams.get("class") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.characterName = { contains: search, mode: "insensitive" };
    if (["warrior", "rogue", "mage", "tank"].includes(charClass)) where.class = charClass;

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        select: {
          id: true, characterName: true, class: true, origin: true,
          level: true, currentXp: true, gold: true, statPointsAvailable: true,
          strength: true, agility: true, vitality: true, endurance: true,
          intelligence: true, wisdom: true, luck: true, charisma: true,
          maxHp: true, currentHp: true, armor: true, magicResist: true,
          currentStamina: true, maxStamina: true,
          pvpRating: true, pvpWins: true, pvpLosses: true,
          pvpWinStreak: true, highestPvpRank: true,
          createdAt: true, lastPlayed: true,
          user: { select: { id: true, username: true, email: true } },
          equipment: {
            where: { isEquipped: true },
            select: {
              id: true, equippedSlot: true, upgradeLevel: true,
              item: { select: { itemName: true, rarity: true, itemType: true } },
            },
          },
        },
        orderBy: { level: "desc" },
        skip, take: limit,
      }),
      prisma.character.count({ where }),
    ]);
    return NextResponse.json({ characters, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[admin/characters GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, { prefix: "admin-chars-w", maxRequests: 30 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const characterId = body.characterId as string;
    if (!characterId) return NextResponse.json({ error: "Missing characterId" }, { status: 400 });

    const target = await prisma.character.findUnique({ where: { id: characterId } });
    if (!target) return NextResponse.json({ error: "Character not found" }, { status: 404 });

    const update: any = {};
    const numFields = ["gold", "level", "currentXp", "statPointsAvailable", "currentStamina", "pvpRating",
      "strength", "agility", "vitality", "endurance", "intelligence", "wisdom", "luck", "charisma"] as const;
    for (const f of numFields) {
      if (typeof body[f] === "number" && Number.isFinite(body[f] as number)) {
        update[f] = Math.max(0, Math.floor(body[f] as number));
      }
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const updated = await prisma.character.update({
      where: { id: characterId }, data: update,
      select: { id: true, characterName: true, level: true, gold: true, currentStamina: true, pvpRating: true },
    });
    return NextResponse.json({ character: updated });
  } catch (error) {
    console.error("[admin/characters PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
