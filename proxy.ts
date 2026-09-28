import { createServerClient } from "@supabase/ssr";
import { NextResponse, userAgent, type NextRequest } from "next/server";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const desktopPages: string[] = [];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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

  const role = (data?.claims?.user_metadata as { role?: string } | undefined)?.role;
  if (data?.claims && (role === "student" || role === "faculty") && entryPages.has(pathname)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return redirectTo(`/${role}/home`);
    await supabase.auth.signOut({ scope: "local" });
  }
  const returning = request.cookies.has(visitedCookie);
  if (pathname === "/") return redirectTo(returning ? "/welcome" : "/splash");
  if (pathname === "/splash" && returning) return redirectTo("/welcome");

  const page = serveLayout(request, response);
  if (!returning) {
    page.cookies.set(visitedCookie, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return page;
}

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

function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

const sharedPaths = ["/auth", "/api"];

const visitedCookie = "teech_visited";

const entryPages = new Set(["/", "/splash", "/welcome", "/student/sign-in", "/faculty/sign-in"]);

const publicPortalPages = new Set([
  "sign-in",
  "create-account",
  "account-created",
  "forgot-password",
  "password-reset",
]);

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
