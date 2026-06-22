import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

async function findUniqueSlug(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  base: string
): Promise<string> {
  const candidate = `${base}-copy`;
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", candidate)
    .maybeSingle();
  if (!data) return candidate;

  for (let n = 2; n < 100; n++) {
    const next = `${base}-copy-${n}`;
    const { data: taken } = await supabase
      .from("products")
      .select("slug")
      .eq("slug", next)
      .maybeSingle();
    if (!taken) return next;
  }
  return `${base}-copy-${Date.now()}`;
}

async function findUniquePublicId(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  table: "products" | "product_variants",
  base: string
): Promise<string> {
  const candidate = `${base}-copy`;
  const { data } = await supabase
    .from(table)
    .select("public_id")
    .eq("public_id", candidate)
    .maybeSingle();
  if (!data) return candidate;

  for (let n = 2; n < 100; n++) {
    const next = `${base}-copy-${n}`;
    const { data: taken } = await supabase
      .from(table)
      .select("public_id")
      .eq("public_id", next)
      .maybeSingle();
    if (!taken) return next;
  }
  return `${base}-copy-${Date.now()}`;
}

async function findUniqueVariantSku(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  base: string
): Promise<string> {
  const candidate = `${base}-copy`;
  const { data } = await supabase
    .from("product_variants")
    .select("sku")
    .eq("sku", candidate)
    .maybeSingle();
  if (!data) return candidate;

  for (let n = 2; n < 100; n++) {
    const next = `${base}-copy-${n}`;
    const { data: taken } = await supabase
      .from("product_variants")
      .select("sku")
      .eq("sku", next)
      .maybeSingle();
    if (!taken) return next;
  }
  return `${base}-copy-${Date.now()}`;
}

export async function POST(req: Request) {
  let newProductId: string | null = null;

  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { productId?: string };
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: source, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError || !source) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: sourceVariants, error: variantFetchError } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true);

    if (variantFetchError) {
      return NextResponse.json(
        { error: variantFetchError.message },
        { status: 500 }
      );
    }

    const newSlug = await findUniqueSlug(supabase, source.slug);
    const newPublicId = source.public_id
      ? await findUniquePublicId(supabase, "products", source.public_id)
      : null;

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        name: `${source.name} (Copy)`,
        slug: newSlug,
        public_id: newPublicId,
        description: source.description,
        short_description: source.short_description,
        image_url: source.image_url,
        is_active: false,
        sort_order: source.sort_order,
        seo_title: source.seo_title,
        seo_description: source.seo_description,
      })
      .select("id")
      .single();

    if (insertError || !newProduct) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to duplicate product" },
        { status: 500 }
      );
    }

    newProductId = newProduct.id;

    if (sourceVariants && sourceVariants.length > 0) {
      const variantInserts = await Promise.all(
        sourceVariants.map(async (v) => ({
          product_id: newProductId!,
          name: v.name,
          public_id: v.public_id
            ? await findUniquePublicId(supabase, "product_variants", v.public_id)
            : null,
          sku: await findUniqueVariantSku(supabase, v.sku),
          price_eur: v.price_eur,
          stock_quantity: v.stock_quantity,
          is_active: false,
        }))
      );

      const { error: variantInsertError } = await supabase
        .from("product_variants")
        .insert(variantInserts);

      if (variantInsertError) {
        await supabase.from("products").delete().eq("id", newProductId);
        return NextResponse.json(
          { error: variantInsertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, productId: newProduct.id });
  } catch (err) {
    if (newProductId) {
      const supabase = getSupabaseAdminClient();
      await supabase.from("products").delete().eq("id", newProductId);
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
