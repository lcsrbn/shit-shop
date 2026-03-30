import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_COOKIE = "shit_shop_admin_session";

async function isMaintenanceMode(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase envs for proxy maintenance check");
    return true;
  }

  try {
    const supabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single();

    if (error) {
      console.error("Proxy maintenance query error:", error.message);
      return true;
    }

    return data?.value === true;
  } catch (error) {
    console.error("Proxy maintenance fatal error:", error);
    return true;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasAdminSession = req.cookies.get(ADMIN_COOKIE)?.value === "1";
  const maintenanceMode = await isMaintenanceMode();

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname.includes(".");

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isApiAllowed =
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/admin-auth/login") ||
    pathname.startsWith("/api/admin-auth/logout") ||
    pathname.startsWith("/api/admin/orders/update-status") ||
    pathname.startsWith("/api/admin/settings/toggle-maintenance") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/checkout");

  const isClientAllowed =
    pathname === "/login" ||
    pathname === "/orders" ||
    pathname === "/maintenance" ||
    pathname === "/success" ||
    pathname === "/cancel";

  if (isStaticAsset || isAdminRoute || isApiAllowed || isClientAllowed) {
    return NextResponse.next();
  }

  if (maintenanceMode && !hasAdminSession) {
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