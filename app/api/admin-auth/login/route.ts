import { NextResponse } from "next/server";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  const formData = await req.formData();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (adminEmails.length === 0 || !adminPassword) {
    return new NextResponse("Missing admin credentials in environment", {
      status: 500,
    });
  }

  if (!adminEmails.includes(email) || password !== adminPassword) {
    return new NextResponse("Credenziali admin non valide", {
      status: 401,
    });
  }

  const response = NextResponse.redirect(new URL("/admin/orders", req.url), {
    status: 303,
  });

  response.cookies.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}