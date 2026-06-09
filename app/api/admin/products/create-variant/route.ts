import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

type ReqBody = {
  productId?: string;
  name?: string;
  public_id?: string;
  sku?: string;
  price_eur?: number;
  stock_quantity?: number;
  is_active?: boolean;
};

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

    const productId = requiredText(body.productId);
    const name = requiredText(body.name);
    const publicId = requiredText(body.public_id);
    const sku = requiredText(body.sku);
    const price = Number(body.price_eur);
    const stock = Number(body.stock_quantity);

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Missing variant name" }, { status: 400 });
    }

    if (!publicId) {
      return NextResponse.json(
        { error: "Missing variant public ID" },
        { status: 400 }
      );
    }

    if (!sku) {
      return NextResponse.json({ error: "Missing SKU" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: existingVariant } = await supabase
      .from("product_variants")
      .select("id")
      .or(`sku.eq.${sku},public_id.eq.${publicId}`)
      .maybeSingle();

    if (existingVariant) {
      return NextResponse.json(
        { error: "A variant with this SKU or public ID already exists" },
        { status: 409 }
      );
    }

    const { data: createdVariant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name,
        public_id: publicId,
        sku,
        price_eur: price,
        stock_quantity: stock,
        is_active: Boolean(body.is_active),
      })
      .select("*")
      .single();

    if (variantError || !createdVariant) {
      return NextResponse.json(
        { error: variantError?.message ?? "Failed to create variant" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      variant: createdVariant,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}