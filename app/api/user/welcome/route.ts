import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasSeenWelcome: true },
    });
    if (!dbUser) {
      return NextResponse.json({ hasSeenWelcome: false });
    }
    return NextResponse.json({ hasSeenWelcome: dbUser.hasSeenWelcome });
  } catch (err) {
    console.error("[api/user/welcome GET]", err);
    return NextResponse.json(
      { error: "Failed to load welcome status" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { hasSeenWelcome: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/user/welcome POST]", err);
    return NextResponse.json(
      { error: "Failed to update welcome status" },
      { status: 500 }
    );
  }
}
