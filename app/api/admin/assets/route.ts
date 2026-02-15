import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BUCKET = "game-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

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

/** GET — list all overrides (public: any user can resolve asset URLs) */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from("asset_overrides")
      .select("asset_key, storage_path, file_size_bytes");

    if (error) {
      console.error("[admin/assets GET]", error);
      return NextResponse.json(
        { error: "Failed to load overrides" },
        { status: 500 }
      );
    }

    const urlBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
    const overrides: Record<string, string> = {};
    const overrideFileSizes: Record<string, number> = {};
    for (const r of rows ?? []) {
      overrides[r.asset_key] = `${urlBase}/${r.storage_path}`;
      if (r.file_size_bytes != null) overrideFileSizes[r.asset_key] = r.file_size_bytes;
    }
    return NextResponse.json({ overrides, overrideFileSizes });
  } catch (err) {
    console.error("[admin/assets GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** POST — upload file and upsert override (admin only) */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, {
      prefix: "admin-assets-upload",
      maxRequests: 30,
    });
    if (!rl.allowed)
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429 }
      );

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const assetKey = formData.get("assetKey") as string | null;
    const originalPath = formData.get("originalPath") as string | null;

    if (!file || !assetKey?.trim() || !originalPath?.trim()) {
      return NextResponse.json(
        { error: "Missing file, assetKey, or originalPath" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const type = file.type?.toLowerCase();
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Use PNG, JPEG, WebP or GIF" },
        { status: 400 }
      );
    }

    const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1] || "png";
    const storagePath = `${assetKey.trim()}.${ext}`.replace(/\/+/g, "/");

    const supabase = await createServerSupabaseClient();
    const buf = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buf, {
        contentType: type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[admin/assets POST] upload", uploadError);
      return NextResponse.json(
        { error: "Upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

    const fileSizeBytes = file.size;
    const { error: upsertError } = await supabase.from("asset_overrides").upsert(
      {
        asset_key: assetKey.trim(),
        storage_path: storagePath,
        original_path: originalPath.trim(),
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
        file_size_bytes: fileSizeBytes,
      },
      { onConflict: "asset_key" }
    );

    if (upsertError) {
      console.error("[admin/assets POST] upsert", upsertError);
      return NextResponse.json(
        { error: "Failed to save override" },
        { status: 500 }
      );
    }

    const urlBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
    const publicUrl = `${urlBase}/${storagePath}`;
    return NextResponse.json({ url: publicUrl, assetKey: assetKey.trim() });
  } catch (err) {
    console.error("[admin/assets POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** DELETE — remove override and file (admin only) */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = checkRateLimit(admin.id, {
      prefix: "admin-assets-delete",
      maxRequests: 60,
    });
    if (!rl.allowed)
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429 }
      );

    const { searchParams } = request.nextUrl;
    const assetKey = searchParams.get("assetKey")?.trim();
    if (!assetKey) {
      return NextResponse.json(
        { error: "Missing assetKey" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: row, error: fetchError } = await supabase
      .from("asset_overrides")
      .select("storage_path")
      .eq("asset_key", assetKey)
      .single();

    if (fetchError || !row) {
      return NextResponse.json(
        { error: "Override not found" },
        { status: 404 }
      );
    }

    await supabase.storage.from(BUCKET).remove([row.storage_path]);
    const { error: deleteError } = await supabase
      .from("asset_overrides")
      .delete()
      .eq("asset_key", assetKey);

    if (deleteError) {
      console.error("[admin/assets DELETE]", deleteError);
      return NextResponse.json(
        { error: "Failed to remove override" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/assets DELETE]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
