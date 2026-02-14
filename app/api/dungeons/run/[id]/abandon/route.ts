import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(authUser.id, {
      prefix: "dungeon-abandon",
      windowMs: 10_000,
      maxRequests: 5,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const { id: runId } = await params;
    if (!runId) {
      return NextResponse.json({ error: "Run ID required" }, { status: 400 });
    }

    const run = await prisma.dungeonRun.findFirst({
      where: { id: runId },
      include: { character: { select: { userId: true } } },
    });
    if (!run || run.character.userId !== authUser.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Don't allow abandoning dungeon_rush via this route (use dungeon-rush/abandon)
    if (run.difficulty === "dungeon_rush") {
      return NextResponse.json({ error: "Use dungeon-rush abandon" }, { status: 400 });
    }

    await prisma.dungeonRun.delete({ where: { id: runId } });

    return NextResponse.json({ message: "Run abandoned" });
  } catch (error) {
    console.error("[api/dungeons/run/abandon POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
