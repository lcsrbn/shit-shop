import { NextResponse } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", req.url), {
    status: 303,
  });

  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}