import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const requireAdmin = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "admin") return null;
  return user;
};

/** GET — list all text overrides (public) */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from("text_overrides")
      .select("text_key, text_value");

    if (error) {
      console.error("[admin/text-overrides GET]", error);
      return NextResponse.json(
        { error: "Failed to load overrides" },
        { status: 500 }
      );
    }

    const overrides: Record<string, string> = {};
    for (const r of rows ?? []) {
      overrides[r.text_key] = r.text_value ?? "";
    }
    return NextResponse.json({ overrides });
  } catch (err) {
    console.error("[admin/text-overrides GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** PUT — upsert text override (admin only) */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, {
      prefix: "admin-text-overrides-put",
      maxRequests: 60,
    });
    if (!rl.allowed)
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429 }
      );

    const body = await request.json();
    const textKey = typeof body?.textKey === "string" ? body.textKey.trim() : "";
    const textValue = typeof body?.textValue === "string" ? body.textValue : "";
    const originalValue =
      typeof body?.originalValue === "string" ? body.originalValue : null;

    if (!textKey) {
      return NextResponse.json(
        { error: "Missing textKey" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { error: upsertError } = await supabase
      .from("text_overrides")
      .upsert(
        {
          text_key: textKey,
          text_value: textValue,
          original_value: originalValue,
          updated_at: new Date().toISOString(),
          updated_by: admin.id,
        },
        { onConflict: "text_key" }
      );

    if (upsertError) {
      console.error("[admin/text-overrides PUT]", upsertError);
      return NextResponse.json(
        { error: "Failed to save override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, textKey });
  } catch (err) {
    console.error("[admin/text-overrides PUT]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** DELETE — remove text override (admin only) */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, {
      prefix: "admin-text-overrides-delete",
      maxRequests: 60,
    });
    if (!rl.allowed)
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429 }
      );

    const { searchParams } = request.nextUrl;
    const textKey = searchParams.get("textKey")?.trim();
    if (!textKey) {
      return NextResponse.json(
        { error: "Missing textKey" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { error: deleteError } = await supabase
      .from("text_overrides")
      .delete()
      .eq("text_key", textKey);

    if (deleteError) {
      console.error("[admin/text-overrides DELETE]", deleteError);
      return NextResponse.json(
        { error: "Failed to remove override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/text-overrides DELETE]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
