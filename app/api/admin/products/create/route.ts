import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

type ReqBody = {
  product?: {
    name?: string;
    slug?: string;
    public_id?: string;
    short_description?: string;
    description?: string;
    image_url?: string;
    sort_order?: number;
    seo_title?: string;
    seo_description?: string;
    is_active?: boolean;
  };
  variant?: {
    name?: string;
    public_id?: string;
    sku?: string;
    price_eur?: number;
    stock_quantity?: number;
    is_active?: boolean;
  };
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ReqBody;

    const productName = requiredText(body.product?.name);
    const productSlug = requiredText(body.product?.slug);
    const productPublicId = requiredText(body.product?.public_id);

    const variantName = requiredText(body.variant?.name);
    const variantPublicId = requiredText(body.variant?.public_id);
    const variantSku = requiredText(body.variant?.sku);

    const price = Number(body.variant?.price_eur);
    const stock = Number(body.variant?.stock_quantity);

    if (!productName) {
      return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    }

    if (!productSlug) {
      return NextResponse.json({ error: "Missing product slug" }, { status: 400 });
    }

    if (!productPublicId) {
      return NextResponse.json(
        { error: "Missing product public ID" },
        { status: 400 }
      );
    }

    if (!variantName) {
      return NextResponse.json({ error: "Missing variant name" }, { status: 400 });
    }

    if (!variantPublicId) {
      return NextResponse.json(
        { error: "Missing variant public ID" },
        { status: 400 }
      );
    }

    if (!variantSku) {
      return NextResponse.json({ error: "Missing variant SKU" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid variant price" }, { status: 400 });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid variant stock" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .or(`slug.eq.${productSlug},public_id.eq.${productPublicId}`)
      .maybeSingle();

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this slug or public ID already exists" },
        { status: 409 }
      );
    }

    const { data: existingVariant } = await supabase
      .from("product_variants")
      .select("id")
      .or(`sku.eq.${variantSku},public_id.eq.${variantPublicId}`)
      .maybeSingle();

    if (existingVariant) {
      return NextResponse.json(
        { error: "A variant with this SKU or public ID already exists" },
        { status: 409 }
      );
    }

    const { data: createdProduct, error: productError } = await supabase
      .from("products")
      .insert({
        name: productName,
        slug: productSlug,
        public_id: productPublicId,
        short_description: cleanText(body.product?.short_description),
        description: cleanText(body.product?.description),
        image_url: cleanText(body.product?.image_url),
        sort_order: Number.isFinite(Number(body.product?.sort_order))
          ? Number(body.product?.sort_order)
          : 0,
        seo_title: cleanText(body.product?.seo_title),
        seo_description: cleanText(body.product?.seo_description),
        is_active: Boolean(body.product?.is_active),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (productError || !createdProduct) {
      return NextResponse.json(
        { error: productError?.message ?? "Failed to create product" },
        { status: 500 }
      );
    }

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: createdProduct.id,
        name: variantName,
        public_id: variantPublicId,
        sku: variantSku,
        price_eur: price,
        stock_quantity: stock,
        is_active: Boolean(body.variant?.is_active),
      });

    if (variantError) {
      await supabase.from("products").delete().eq("id", createdProduct.id);

      return NextResponse.json(
        { error: variantError.message },
        { status: 500 }
      );
    }

    const imageUrl = cleanText(body.product?.image_url);

    if (imageUrl) {
      const { error: mediaError } = await supabase.from("product_media").insert({
        product_id: createdProduct.id,
        type: "cover",
        url: imageUrl,
        alt: productName,
        sort_order: 0,
        is_active: true,
      });

      if (mediaError) {
        console.error("Product media create error:", mediaError);
      }
    }

    return NextResponse.json({
      ok: true,
      productId: createdProduct.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}