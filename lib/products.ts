import type { Product } from "@/lib/product-types";

export type { Product };

export function getProductById(products: Product[], id: string) {
  return products.find((product) => product.id === id) ?? null;
}

export function getVariantById(product: Product | null, variantId: string) {
  if (!product) return null;

  return product.variants.find((variant) => variant.id === variantId) ?? null;
}

export function getDefaultVariant(product: Product | null) {
  if (!product) return null;

  return (
    product.variants.find((variant) => variant.id === product.defaultVariantId) ??
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0] ??
    null
  );
}

export function getDefaultVariantByProductId(
  products: Product[],
  productId: string
) {
  return getDefaultVariant(getProductById(products, productId));
}

export function isProductInStock(products: Product[], productId: string) {
  const variant = getDefaultVariantByProductId(products, productId);
  return Boolean(variant && variant.stock > 0);
}