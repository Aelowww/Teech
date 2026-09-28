import { createServerClient } from "@supabase/ssr";
import { NextResponse, userAgent, type NextRequest } from "next/server";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

// Public URLs are shared by both apps: /student/home is served from
// app/mobile/student/home on phones and tablets, and from
// app/desktop/student/home on computers once that page exists.
//
// Add a path here when its desktop page is ready. A path also covers
// everything below it, so "/faculty" enables every /faculty/... page.
// Anything not listed falls back to the mobile page.
const desktopPages: string[] = [];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // The layout folders are internal; always use the shared public URL.
  const layoutPrefix = pathname.match(/^\/(mobile|desktop)(?=\/|$)/);
  if (layoutPrefix) {
    return NextResponse.redirect(new URL(pathname.slice(layoutPrefix[0].length) || "/", request.url));
  }

  if (!isSupabaseConfigured()) {
    return serveLayout(request, NextResponse.next({ request }));
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const redirectTo = (path: string) => withCookies(NextResponse.redirect(new URL(path, request.url)), response);

  const portal = privatePortal(pathname);
  if (portal && !data?.claims) return redirectTo(`/${portal}/sign-in`);

  // Signed-in users skip the splash and sign-in screens. The role claim only
  // picks the destination; each page still verifies the role from the database.
  const role = (data?.claims?.user_metadata as { role?: string } | undefined)?.role;
  if (data?.claims && (role === "student" || role === "faculty") && entryPages.has(pathname)) {
    return redirectTo(`/${role}/home`);
  }
  if (pathname === "/") return redirectTo("/splash");
  return serveLayout(request, response);
}

// Rewrites a page request to the mobile or desktop folder for this device.
function serveLayout(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  if (sharedPaths.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) || pathname.startsWith("/_") || pathname.startsWith("/.")) {
    return response;
  }

  const { device } = userAgent(request);
  const isComputer = !device.type;
  const hasDesktopPage = desktopPages.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  const layout = isComputer && hasDesktopPage ? "desktop" : "mobile";

  const url = request.nextUrl.clone();
  url.pathname = `/${layout}${pathname === "/" ? "" : pathname}`;
  return withCookies(NextResponse.rewrite(url, { request }), response);
}

// Carries refreshed Supabase session cookies over to a new response.
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

// Routes that live at the app root and are shared by both layouts.
const sharedPaths = ["/auth", "/api"];

const entryPages = new Set(["/", "/splash", "/welcome", "/student/sign-in", "/faculty/sign-in"]);

const publicPortalPages = new Set([
  "sign-in",
  "create-account",
  "account-created",
  "forgot-password",
  "password-reset",
]);

// Returns the portal a signed-out visitor must sign in to, or null for public pages.
function privatePortal(pathname: string) {
  const [, portal, page] = pathname.split("/");
  if (portal !== "student" && portal !== "faculty") return null;
  return page && publicPortalPages.has(page) ? null : portal;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
