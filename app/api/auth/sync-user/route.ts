import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // #region agent log
    console.log("[sync-user] POST called");
    // #endregion
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    // #region agent log
    console.log("[sync-user] getUser:", { hasUser: !!authUser, userId: authUser?.id, authError: authError?.message ?? null });
    // #endregion
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String((body.email as string) ?? authUser.email ?? "").trim();
    const username = String(
      (body.username as string) ??
        authUser.user_metadata?.username ??
        authUser.email?.split("@")[0] ??
        ""
    ).trim();
    const safeId = authUser.id.replace(/-/g, "_");
    const uniqueEmail = email || `user-${safeId}@placeholder.local`;
    const uniqueUsername = username || `user_${safeId}`;
    const authProvider = authUser.app_metadata?.provider ?? "email";

    // #region agent log
    console.log("[sync-user] prisma query:", { userId: authUser.id, uniqueEmail, uniqueUsername });
    // #endregion
    let existing;
    try {
      existing = await prisma.user.findUnique({
        where: { id: authUser.id },
      });
    } catch (prismaErr) {
      // #region agent log
      console.error("[sync-user] prisma findUnique error:", prismaErr instanceof Error ? prismaErr.message : String(prismaErr));
      // #endregion
      throw prismaErr;
    }
    // #region agent log
    console.log("[sync-user] existing user:", !!existing);
    // #endregion
    if (existing) {
      try {
        await prisma.user.update({
          where: { id: authUser.id },
          data: { lastLogin: new Date(), email: uniqueEmail, username: uniqueUsername },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          await prisma.user.update({
            where: { id: authUser.id },
            data: { lastLogin: new Date() },
          });
        } else {
          throw e;
        }
      }
      return NextResponse.json({ ok: true, existing: true });
    }

    try {
      await prisma.user.create({
        data: {
          id: authUser.id,
          email: uniqueEmail,
          username: uniqueUsername,
          authProvider,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        await prisma.user.create({
          data: {
            id: authUser.id,
            email: `user-${safeId}@placeholder.local`,
            username: `user_${safeId}`,
            authProvider,
          },
        });
      } else {
        throw e;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A user with this email or name already exists" },
        { status: 409 }
      );
    }
    // #region agent log
    console.error("[sync-user] FATAL:", err instanceof Error ? { message: err.message, stack: err.stack?.slice(0, 500) } : String(err));
    // #endregion
    console.error("[sync-user]", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "User sync error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
