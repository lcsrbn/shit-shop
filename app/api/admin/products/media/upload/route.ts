import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";
const BUCKET = "product-images";
const MEDIA_TYPES = ["main", "detail", "sprite"] as const;

type MediaType = (typeof MEDIA_TYPES)[number];

function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && MEDIA_TYPES.includes(value as MediaType);
}

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const productId = formData.get("productId");
  const type = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  if (!isMediaType(type)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (type === "detail") {
    const { count, error: countError } = await supabase
      .from("product_media")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("type", "detail")
      .eq("is_active", true);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 detail images allowed" },
        { status: 400 }
      );
    }
  }

  const path = `products/${productId}/${type}/${Date.now()}-${safeFileName(
    file.name
  )}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = publicData.publicUrl;

  if (type === "main" || type === "sprite") {
    await supabase
      .from("product_media")
      .update({ is_active: false })
      .eq("product_id", productId)
      .eq("type", type)
      .eq("is_active", true);
  }

  const { data: lastMedia } = await supabase
    .from("product_media")
    .select("sort_order")
    .eq("product_id", productId)
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = Number(lastMedia?.sort_order ?? -1) + 1;

  const { data: createdMedia, error: mediaError } = await supabase
    .from("product_media")
    .insert({
      product_id: productId,
      type,
      url,
      alt: file.name,
      sort_order: nextSortOrder,
      metadata: {
        bucket: BUCKET,
        path,
        contentType: file.type,
        size: file.size,
      },
      is_active: true,
    })
    .select("*")
    .single();

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 });
  }

  if (type === "main") {
    await supabase
      .from("products")
      .update({
        image_url: url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
  }

  return NextResponse.json({
    ok: true,
    media: createdMedia,
  });
}