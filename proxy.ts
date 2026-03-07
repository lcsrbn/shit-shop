import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_bypass";

export function proxy(req: NextRequest) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "on";
  const adminBypass = req.cookies.get(ADMIN_COOKIE)?.value === "1";

  const { pathname } = req.nextUrl;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images");

  const isAlwaysAllowed =
    pathname === "/maintenance" ||
    pathname === "/success" ||
    pathname === "/cancel" ||
    pathname === "/orders" ||
    pathname.startsWith("/api/admin-login") ||
    pathname.startsWith("/api/admin-logout") ||
    pathname.startsWith("/api/stripe/webhook");

  if (isStaticAsset || isAlwaysAllowed) {
    return NextResponse.next();
  }

  if (maintenanceMode && !adminBypass) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)"],
};