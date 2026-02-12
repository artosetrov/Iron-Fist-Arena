import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
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

    const existing = await prisma.user.findUnique({
      where: { id: authUser.id },
    });
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
    console.error("[sync-user]", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "User sync error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
