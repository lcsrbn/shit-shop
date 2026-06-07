import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { ProductEditForm } from "@/components/admin/ProductEditForm";

export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

type ProductVariantRow = {
  id: string;
  public_id: string | null;
  name: string;
  sku: string;
  price_eur: number | string | null;
  stock_quantity: number | null;
  is_active: boolean | null;
};

type ProductRow = {
  id: string;
  public_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  variants: ProductVariantRow[];
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string): Promise<ProductRow> {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      public_id,
      slug,
      name,
      description,
      short_description,
      image_url,
      is_active,
      sort_order,
      seo_title,
      seo_description,
      variants:product_variants (
        id,
        public_id,
        name,
        sku,
        price_eur,
        stock_quantity,
        is_active
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  return {
    ...(data as ProductRow),
    variants: ((data as ProductRow).variants ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  };
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <main style={{ padding: 30, maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop admin</div>

          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 34,
              fontWeight: 950,
              letterSpacing: "-0.03em",
            }}
          >
            Edit Product
          </h1>

          <p style={{ marginTop: 10, opacity: 0.75 }}>
            {product.name} · {product.public_id ?? product.id}
          </p>
        </div>

        <Link
          href="/admin/products"
          style={{
            display: "inline-block",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "10px 14px",
            color: "#111",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← Back to products
        </Link>
      </div>

      <ProductEditForm product={product} />
    </main>
  );
}