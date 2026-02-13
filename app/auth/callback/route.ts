import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") ?? "/hub";
  // Sanitize redirect: only allow relative paths starting with /
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/hub";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Sync user to DB (same as email login)
  try {
    const syncUrl = new URL("/api/auth/sync-user", origin);
    await fetch(syncUrl.toString(), {
      method: "POST",
      headers: { cookie: cookieStore.toString() },
    });
  } catch (syncErr) {
    console.error("[auth/callback] sync-user error:", syncErr);
  }

  // Check if user has characters — if not, send to onboarding
  let destination = redirect;
  try {
    const charUrl = new URL("/api/characters", origin);
    const charRes = await fetch(charUrl.toString(), {
      headers: { cookie: cookieStore.toString() },
    });
    if (charRes.ok) {
      const charData = await charRes.json();
      const hasCharacters = (charData.characters?.length ?? 0) > 0;
      if (!hasCharacters) {
        destination = "/onboarding";
      }
    }
  } catch (charErr) {
    console.error("[auth/callback] character check error:", charErr);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
