import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

type ReqBody = {
  variantId?: string;
  name?: string;
  sku?: string;
  price_eur?: number;
  stock_quantity?: number;
  is_active?: boolean;
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ReqBody;

    if (!body.variantId) {
      return NextResponse.json({ error: "Missing variantId" }, { status: 400 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Missing variant name" }, { status: 400 });
    }

    if (!body.sku?.trim()) {
      return NextResponse.json({ error: "Missing SKU" }, { status: 400 });
    }

    const price = Number(body.price_eur);
    const stock = Number(body.stock_quantity);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("product_variants")
      .update({
        name: body.name.trim(),
        sku: body.sku.trim(),
        price_eur: price,
        stock_quantity: stock,
        is_active: Boolean(body.is_active),
      })
      .eq("id", body.variantId);

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