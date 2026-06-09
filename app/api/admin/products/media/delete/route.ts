import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    mediaId?: string;
  };

  if (!body.mediaId) {
    return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("product_media")
    .update({ is_active: false })
    .eq("id", body.mediaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}