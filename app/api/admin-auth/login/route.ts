import { NextResponse } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  const formData = await req.formData();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!adminEmail || !adminPassword) {
    return new NextResponse("Missing admin credentials in environment", {
      status: 500,
    });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return new NextResponse("Credenziali admin non valide", {
      status: 401,
    });
  }

  const response = NextResponse.redirect(
    new URL("/admin/orders", req.url)
  );

  response.cookies.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}