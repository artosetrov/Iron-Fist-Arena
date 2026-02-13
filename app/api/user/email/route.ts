import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const newEmail = String(body.newEmail ?? "").trim().toLowerCase();

    if (!newEmail || !newEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    /* Update via Supabase Auth — sends confirmation email to new address */
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    /* Optimistically update Prisma record (will also be synced on next login) */
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail },
      });
    } catch {
      /* Non-critical — sync-user will fix on next login */
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[change-email]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
