import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_bypass";

export function middleware(req: NextRequest) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "on";
  const adminBypass = req.cookies.get(ADMIN_COOKIE)?.value === "1";

  const { pathname } = req.nextUrl;

  // Always allow Next internals, static assets, favicon, robots, etc.
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public");

  // Always allow these routes
  const isAlwaysAllowed =
    pathname === "/maintenance" ||
    pathname.startsWith("/api/admin-login") ||
    pathname.startsWith("/api/admin-logout");

  if (isStaticAsset || isAlwaysAllowed) {
    return NextResponse.next();
  }

  // In maintenance mode, block everything except admin bypass users
  if (maintenanceMode && !adminBypass) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Run on all app routes except common static file extensions.
      This reduces unnecessary middleware execution.
    */
    "/((?!.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)",
  ],
};