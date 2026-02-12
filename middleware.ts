import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const gamePaths = ["/hub", "/arena", "/dungeon", "/inventory", "/shop", "/combat", "/character", "/settings"];
const authPaths = ["/login", "/register"];

const isGamePath = (pathname: string) =>
  gamePaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
const isAuthPath = (pathname: string) =>
  authPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  try {
    let response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;
    const isApi = pathname.startsWith("/api");

    if (!isApi && isGamePath(pathname) && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (!isApi && isAuthPath(pathname) && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/hub";
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
