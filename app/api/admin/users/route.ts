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
    const rl = checkRateLimit(admin.id, { prefix: "admin-users", maxRequests: 60 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const role = searchParams.get("role") ?? "";
    const banned = searchParams.get("banned") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role === "admin" || role === "player") where.role = role;
    if (banned === "true") where.isBanned = true;
    if (banned === "false") where.isBanned = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, role: true, gems: true,
          isBanned: true, banReason: true, premiumUntil: true,
          createdAt: true, lastLogin: true,
          characters: { select: { id: true, characterName: true, class: true, level: true } },
        },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[admin/users GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, { prefix: "admin-users-w", maxRequests: 30 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const userId = body.userId as string;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const update: any = {};
    if (typeof body.isBanned === "boolean") {
      update.isBanned = body.isBanned;
      update.banReason = body.isBanned ? ((body.banReason as string) || "No reason") : null;
    }
    if (body.role === "admin" || body.role === "player") update.role = body.role;
    if (typeof body.gemsAdjust === "number" && Number.isInteger(body.gemsAdjust)) {
      update.gems = Math.max(0, target.gems + (body.gemsAdjust as number));
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId }, data: update,
      select: {
        id: true, username: true, email: true, role: true, gems: true,
        isBanned: true, banReason: true, premiumUntil: true, createdAt: true, lastLogin: true,
      },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[admin/users PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
