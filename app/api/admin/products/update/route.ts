import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

type ReqBody = {
  productId?: string;
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  seo_title?: string;
  seo_description?: string;
  is_active?: boolean;
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ReqBody;

    if (!body.productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    }

    if (!body.slug?.trim()) {
      return NextResponse.json({ error: "Missing product slug" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("products")
      .update({
        name: body.name.trim(),
        slug: body.slug.trim(),
        short_description: cleanText(body.short_description),
        description: cleanText(body.description),
        image_url: cleanText(body.image_url),
        sort_order: Number.isFinite(Number(body.sort_order))
          ? Number(body.sort_order)
          : 0,
        seo_title: cleanText(body.seo_title),
        seo_description: cleanText(body.seo_description),
        is_active: Boolean(body.is_active),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}