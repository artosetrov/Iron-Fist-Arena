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

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:entry',message:'Callback route entered',data:{hasCode:!!code,redirect,rawRedirect,allParams:Object.fromEntries(searchParams.entries())},timestamp:Date.now(),hypothesisId:'A,B'})}).catch(()=>{});
  // #endregion

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

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:exchangeCode',message:'exchangeCodeForSession result',data:{hasError:!!error,errorMessage:error?.message??null,cookiesAfterExchange:cookieStore.getAll().map((c:{name:string})=>c.name)},timestamp:Date.now(),hypothesisId:'B,E'})}).catch(()=>{});
  // #endregion

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Sync user to DB (same as email login)
  try {
    const syncUrl = new URL("/api/auth/sync-user", origin);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:preSyncUser',message:'About to call sync-user',data:{syncUrl:syncUrl.toString(),cookieHeader:cookieStore.toString().substring(0,200)},timestamp:Date.now(),hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    const syncRes = await fetch(syncUrl.toString(), {
      method: "POST",
      headers: { cookie: cookieStore.toString() },
    });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:postSyncUser',message:'sync-user response',data:{status:syncRes.status,ok:syncRes.ok},timestamp:Date.now(),hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
  } catch (syncErr) {
    console.error("[auth/callback] sync-user error:", syncErr);
  }

  // Skip character check for password reset flow
  if (redirect === "/reset-password") {
    return NextResponse.redirect(`${origin}/reset-password`);
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

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:finalRedirect',message:'Final redirect from callback',data:{destination,redirect,fullUrl:`${origin}${destination}`},timestamp:Date.now(),hypothesisId:'A,E'})}).catch(()=>{});
  // #endregion

  return NextResponse.redirect(`${origin}${destination}`);
}
