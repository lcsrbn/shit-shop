import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Product } from "@/lib/product-types";

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

export type DBProductWithVariant = {
  product: DBProduct;
  variant: DBProductVariant;
};

function getFallbackImage(product: DBProduct) {
  return product.image_url ?? "/products/poster-chaos/front.jpg";
}

function mapDBProductToUIProduct(product: DBProduct): Product | null {
  const variants = product.variants.filter((variant) => variant.is_active);

  if (variants.length === 0) {
    return null;
  }

  const defaultVariant = variants[0];
  const fallbackImage = getFallbackImage(product);

  return {
    id: product.public_id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    coverImage: fallbackImage,
    galleryImages: [fallbackImage],
    variants: variants.map((variant, index) => ({
      id: variant.public_id,
      name: variant.name,
      sku: variant.sku,
      priceEUR: Number(variant.price_eur),
      stock: variant.stock_quantity,
      images: [fallbackImage],
      isDefault: index === 0,
    })),
    defaultVariantId: defaultVariant.public_id,
    priceEUR: Number(defaultVariant.price_eur),
    frontImage: fallbackImage,
    backImage: fallbackImage,
  };
}

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
    variants: (product.variants ?? []).filter((variant) => variant.is_active),
  })) as DBProduct[];
}

export async function getAllActiveProductsForUI(): Promise<Product[]> {
  const products = await getAllActiveProducts();

  return products
    .map(mapDBProductToUIProduct)
    .filter((product): product is Product => product !== null);
}

export async function getProductByPublicId(
  publicId: string
): Promise<DBProduct | null> {
  const products = await getAllActiveProducts();

  return products.find((product) => product.public_id === publicId) ?? null;
}

export async function getProductAndVariantByPublicIds({
  productPublicId,
  variantPublicId,
}: {
  productPublicId: string;
  variantPublicId: string;
}): Promise<DBProductWithVariant | null> {
  const product = await getProductByPublicId(productPublicId);

  if (!product) return null;

  const variant =
    product.variants.find((item) => item.public_id === variantPublicId) ?? null;

  if (!variant) return null;

  return {
    product,
    variant,
  };
}