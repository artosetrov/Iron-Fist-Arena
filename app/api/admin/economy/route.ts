import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, { prefix: "admin-economy", maxRequests: 30 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const [goldAgg, gemsAgg, topGold, topGems, rarityDist, typeDist, charCount, userCount] = await Promise.all([
      prisma.character.aggregate({ _sum: { gold: true }, _avg: { gold: true }, _max: { gold: true } }),
      prisma.user.aggregate({ _sum: { gems: true }, _avg: { gems: true }, _max: { gems: true } }),
      prisma.character.findMany({
        select: { characterName: true, class: true, level: true, gold: true },
        orderBy: { gold: "desc" }, take: 10,
      }),
      prisma.user.findMany({
        select: { username: true, gems: true },
        orderBy: { gems: "desc" }, take: 10,
      }),
      prisma.equipmentInventory.groupBy({
        by: ["isEquipped"],
        _count: true,
      }),
      prisma.item.groupBy({
        by: ["rarity"],
        _count: true,
      }),
      prisma.character.count(),
      prisma.user.count(),
    ]);

    // Equipment count by rarity (via items table join is expensive, use raw count)
    const equipByRarity = await prisma.$queryRaw`
      SELECT i.rarity, COUNT(*)::int as count
      FROM equipment_inventory ei
      JOIN items i ON ei.item_id = i.id
      GROUP BY i.rarity
      ORDER BY count DESC
    ` as { rarity: string; count: number }[];

    const equipByType = await prisma.$queryRaw`
      SELECT i.item_type as "itemType", COUNT(*)::int as count
      FROM equipment_inventory ei
      JOIN items i ON ei.item_id = i.id
      GROUP BY i.item_type
      ORDER BY count DESC
    ` as { itemType: string; count: number }[];

    return NextResponse.json({
      gold: {
        total: goldAgg._sum.gold ?? 0,
        avg: Math.round(goldAgg._avg.gold ?? 0),
        max: goldAgg._max.gold ?? 0,
      },
      gems: {
        total: gemsAgg._sum.gems ?? 0,
        avg: Math.round(gemsAgg._avg.gems ?? 0),
        max: gemsAgg._max.gems ?? 0,
      },
      topGold,
      topGems,
      equipByRarity,
      equipByType,
      totalCharacters: charCount,
      totalUsers: userCount,
    });
  } catch (error) {
    console.error("[admin/economy GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
