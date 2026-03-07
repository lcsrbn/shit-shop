import { NextResponse } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_bypass";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.MAINTENANCE_BYPASS_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { error: "Missing MAINTENANCE_BYPASS_TOKEN on server" },
      { status: 500 }
    );
  }

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL || url.origin)
  );

  response.cookies.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}