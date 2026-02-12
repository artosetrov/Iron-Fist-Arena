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

    // #region agent log
    console.log("[DEBUG api/me] supabase user:", user ? { id: user.id, email: user.email } : null);
    // #endregion

    if (!user) {
      // #region agent log
      console.log("[DEBUG api/me] No supabase user -> 401");
      // #endregion
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, email: true, role: true },
    });

    // #region agent log
    console.log("[DEBUG api/me] dbUser:", dbUser);
    // #endregion

    if (!dbUser) {
      // #region agent log
      console.log("[DEBUG api/me] User not in DB -> 404");
      // #endregion
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(dbUser);
  } catch (err) {
    // #region agent log
    console.error("[DEBUG api/me] CATCH error:", err);
    // #endregion
    console.error("[api/me GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
