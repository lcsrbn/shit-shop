import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_MODE = true;
const ADMIN_COOKIE = "shit_shop_admin_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasAdminSession = req.cookies.get(ADMIN_COOKIE)?.value === "1";

  // ✅ STATIC
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname.includes(".");

  // ✅ ADMIN (SEMPRE PERMESSO)
  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  // ✅ API SEMPRE PERMESSE
  const isApiAllowed =
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/admin-auth") ||
    pathname.startsWith("/api/admin/orders/update-status") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/logout");

  // ✅ CLIENT ROUTES
  const isClientAllowed =
    pathname === "/login" ||
    pathname === "/orders" ||
    pathname === "/maintenance";

  // 🔓 SEMPRE PASSARE QUESTE
  if (isStaticAsset || isAdminRoute || isApiAllowed || isClientAllowed) {
    return NextResponse.next();
  }

  // 🚧 MAINTENANCE SOLO PER UTENTI NORMALI
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