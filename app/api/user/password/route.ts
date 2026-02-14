import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

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

    const rl = checkRateLimit(user.id, { prefix: "password", windowMs: 60_000, maxRequests: 5 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const newPassword = String(body.newPassword ?? "").trim();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
