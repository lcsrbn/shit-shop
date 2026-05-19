import type { Product } from "@/lib/product-types";

export type { Product };

export function getProductById(
  products: Product[],
  id: string
) {
  return products.find((product) => product.id === id) ?? null;
}

export function getVariantById(
  product: Product | null,
  variantId: string
) {
  if (!product) return null;

  return (
    product.variants.find((variant) => variant.id === variantId) ??
    null
  );
}

export function getDefaultVariantByProductId(
  products: Product[],
  productId: string
) {
  const product = getProductById(products, productId);

  if (!product) return null;

  return (
    product.variants.find(
      (variant) => variant.id === product.defaultVariantId
    ) ??
    product.variants[0] ??
    null
  );
}

export function isProductInStock(
  products: Product[],
  productId: string
) {
  const variant = getDefaultVariantByProductId(
    products,
    productId
  );

  if (!variant) return false;

  return variant.stock > 0;
}