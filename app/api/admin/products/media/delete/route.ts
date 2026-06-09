import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  try {
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

    const { data: media, error: mediaReadError } = await supabase
      .from("product_media")
      .select("id, product_id, type, url")
      .eq("id", body.mediaId)
      .single();

    if (mediaReadError || !media) {
      return NextResponse.json(
        { error: mediaReadError?.message ?? "Media not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("product_media")
      .update({ is_active: false })
      .eq("id", body.mediaId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (media.type === "main") {
      const { data: nextMain } = await supabase
        .from("product_media")
        .select("url")
        .eq("product_id", media.product_id)
        .eq("type", "main")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      await supabase
        .from("products")
        .update({
          image_url: nextMain?.url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", media.product_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}