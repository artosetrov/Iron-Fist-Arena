import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { DesignTokens } from "@/lib/design-tokens";

export const dynamic = "force-dynamic";

/* ── Helper: verify current user is admin ── */
const verifyAdmin = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });
  if (!dbUser || dbUser.role !== "admin") return null;
  return dbUser;
};

/* ── GET: load tokens (public — needed by DesignTokenProvider) ── */
export async function GET() {
  try {
    const row = await prisma.designToken.findUnique({ where: { id: "global" } });
    const tokens = (row?.tokens as Partial<DesignTokens>) ?? {};
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("[api/design-tokens GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ── PUT: save tokens (admin only) ── */
export async function PUT(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const tokens = body.tokens as Partial<DesignTokens>;
    if (!tokens || typeof tokens !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.designToken.upsert({
      where: { id: "global" },
      create: { id: "global", tokens: tokens as object, updatedBy: admin.id },
      update: { tokens: tokens as object, updatedBy: admin.id, updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/design-tokens PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
