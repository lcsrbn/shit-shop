import { NextResponse } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_bypass";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const response = NextResponse.redirect(
    new URL("/maintenance", process.env.NEXT_PUBLIC_SITE_URL || url.origin)
  );

  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}