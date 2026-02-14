import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
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

const getCachedDesignTokens = unstable_cache(
  async () => {
    const row = await prisma.designToken.findUnique({ where: { id: "global" } });
    return (row?.tokens as Partial<DesignTokens>) ?? {};
  },
  ["design-tokens"],
  { revalidate: 300, tags: ["design-tokens"] },
);

/* ── GET: load tokens (public — needed by DesignTokenProvider) ── */
export async function GET() {
  try {
    const tokens = await getCachedDesignTokens();
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

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const tokens = body.tokens as Partial<DesignTokens>;
    if (!tokens || typeof tokens !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.designToken.upsert({
      where: { id: "global" },
      create: { id: "global", tokens: tokens as object, updatedBy: admin.id },
      update: { tokens: tokens as object, updatedBy: admin.id, updatedAt: new Date() },
    });

    revalidateTag("design-tokens");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/design-tokens PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
