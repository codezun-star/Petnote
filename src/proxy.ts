import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and gates the dashboard.
 *
 * Next.js 16 renamed `middleware` to `proxy`; the behaviour is unchanged. This
 * is an optimistic redirect only — every dashboard route still verifies the
 * user server-side, and RLS is the real authorization boundary.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Without credentials there is no session to refresh; let the request through
  // so the app can render its "configure Supabase" guidance instead of 500ing.
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Responses that set auth cookies must never be cached by a CDN,
        // or one user's tokens could be served to somebody else.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // The proxy runs ahead of every page, so anything that throws here 500s the
  // whole site — including statically prerendered pages that would otherwise
  // be served straight from the CDN. A malformed or stale auth cookie is
  // enough to do it. Treat any failure as "not signed in" and let the route
  // itself decide; RLS is the real boundary regardless.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    console.error("[proxy] Session lookup failed", error);
  }

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - static assets and image files
     *  - the Paddle webhook, which authenticates itself with a signature and
     *    carries no session
     *  - the PWA surface. The service worker, manifest and icons must be
     *    served plainly; running them through session refresh attaches
     *    Set-Cookie and no-store headers to files the browser needs to cache,
     *    which breaks registration and install.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|icons/|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
