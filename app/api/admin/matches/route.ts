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
    const rl = checkRateLimit(admin.id, { prefix: "admin-matches", maxRequests: 60 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { player1: { characterName: { contains: search, mode: "insensitive" } } },
        { player2: { characterName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [matches, total] = await Promise.all([
      prisma.pvpMatch.findMany({
        where,
        select: {
          id: true,
          player1: { select: { characterName: true, class: true, level: true } },
          player2: { select: { characterName: true, class: true, level: true } },
          player1RatingBefore: true, player1RatingAfter: true,
          player2RatingBefore: true, player2RatingAfter: true,
          winnerId: true, loserId: true,
          turnsTaken: true, matchDuration: true,
          player1GoldReward: true, player2GoldReward: true,
          player1XpReward: true, player2XpReward: true,
          matchType: true, seasonNumber: true,
          combatLog: true,
          playedAt: true,
        },
        orderBy: { playedAt: "desc" },
        skip, take: limit,
      }),
      prisma.pvpMatch.count({ where }),
    ]);
    return NextResponse.json({ matches, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[admin/matches GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
