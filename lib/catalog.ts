import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type ProductMediaType = "main" | "detail" | "sprite";

export type CatalogMedia = {
  id: string;
  product_id: string;
  type: ProductMediaType;
  url: string;
  alt: string | null;
  sort_order: number;
  metadata: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string;
};

export type CatalogVariant = {
  id: string;
  product_id: string;
  public_id: string | null;
  name: string;
  sku: string;
  price_eur: number | string | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  created_at?: string;
};

export type CatalogProduct = {
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
  created_at: string;
  updated_at: string | null;
  variants: CatalogVariant[];
  media: CatalogMedia[];
};

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
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
      created_at,
      updated_at,
      variants:product_variants (
        id,
        product_id,
        public_id,
        name,
        sku,
        price_eur,
        stock_quantity,
        is_active,
        created_at
      ),
      media:product_media (
        id,
        product_id,
        type,
        url,
        alt,
        sort_order,
        metadata,
        is_active,
        created_at
      )
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCatalogProducts error:", error);
    return [];
  }

  return ((data ?? []) as CatalogProduct[]).map((product) => ({
    ...product,
    variants: product.variants ?? [],
    media: (product.media ?? []).filter((item) => item.is_active),
  }));
}

export async function getCatalogProductById(
  id: string
): Promise<CatalogProduct | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
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
      created_at,
      updated_at,
      variants:product_variants (
        id,
        product_id,
        public_id,
        name,
        sku,
        price_eur,
        stock_quantity,
        is_active,
        created_at
      ),
      media:product_media (
        id,
        product_id,
        type,
        url,
        alt,
        sort_order,
        metadata,
        is_active,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const product = data as CatalogProduct;

  return {
    ...product,
    variants: (product.variants ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    media: (product.media ?? [])
      .filter((item) => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}