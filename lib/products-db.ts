import { getSupabaseServerClient } from "@/lib/supabase-server";

export type DBProductVariant = {
  id: string;
  public_id: string;
  name: string;
  sku: string;
  price_eur: number;
  stock_quantity: number;
  is_active: boolean;
};

export type DBProduct = {
  id: string;
  public_id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  variants: DBProductVariant[];
};

export async function getAllActiveProducts(): Promise<DBProduct[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      public_id,
      slug,
      name,
      description,
      image_url,
      is_active,
      variants:product_variants (
        id,
        public_id,
        name,
        sku,
        price_eur,
        stock_quantity,
        is_active
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAllActiveProducts error:", error);

    return [];
  }

  return (data ?? []).map((product) => ({
    ...product,
    variants: (product.variants ?? []).filter(
      (variant) => variant.is_active
    ),
  })) as DBProduct[];
}

export async function getProductByPublicId(
  publicId: string
): Promise<DBProduct | null> {
  const products = await getAllActiveProducts();

  return (
    products.find((product) => product.public_id === publicId) ?? null
  );
}

export async function getVariantByPublicId(
  variantPublicId: string
): Promise<DBProductVariant | null> {
  const products = await getAllActiveProducts();

  for (const product of products) {
    const variant = product.variants.find(
      (v) => v.public_id === variantPublicId
    );

    if (variant) {
      return variant;
    }
  }

  return null;
}