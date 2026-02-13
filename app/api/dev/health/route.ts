import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checks: Record<string, { status: "ok" | "error"; latencyMs: number; detail?: string }> = {};

    // Database check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch (err) {
      checks.database = {
        status: "error",
        latencyMs: Date.now() - dbStart,
        detail: err instanceof Error ? err.message : "Unknown DB error",
      };
    }

    // Supabase auth check
    const sbStart = Date.now();
    try {
      const { data } = await supabase.auth.getSession();
      checks.supabase = {
        status: data.session ? "ok" : "ok",
        latencyMs: Date.now() - sbStart,
      };
    } catch (err) {
      checks.supabase = {
        status: "error",
        latencyMs: Date.now() - sbStart,
        detail: err instanceof Error ? err.message : "Unknown Supabase error",
      };
    }

    // Environment variables check
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
    };

    const allEnvOk = Object.values(envVars).every(Boolean);
    checks.env = {
      status: allEnvOk ? "ok" : "error",
      latencyMs: 0,
      detail: allEnvOk ? undefined : "Missing env vars",
    };

    const overallOk = Object.values(checks).every((c) => c.status === "ok");

    return NextResponse.json({
      status: overallOk ? "healthy" : "degraded",
      version: process.env.npm_package_version ?? "0.1.0",
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      uptime: Math.floor(process.uptime()),
      checks,
      env: envVars,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/dev/health GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
