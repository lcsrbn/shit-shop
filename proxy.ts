import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_MODE = true;
const ADMIN_COOKIE = "shit_shop_admin_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasAdminSession = req.cookies.get(ADMIN_COOKIE)?.value === "1";

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname.includes(".");

  const isAlwaysAllowed =
    pathname === "/maintenance" ||
    pathname === "/login" ||
    pathname === "/orders" ||
    pathname === "/admin" ||
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/orders") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/admin-auth/login") ||
    pathname.startsWith("/api/admin-auth/logout") ||
    pathname.startsWith("/api/admin/orders/update-status") ||
    pathname.startsWith("/api/stripe/webhook");

  if (isStaticAsset || isAlwaysAllowed) {
    return NextResponse.next();
  }

  if (MAINTENANCE_MODE && !hasAdminSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};