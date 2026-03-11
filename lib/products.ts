import type { ProductBase, ProductLegacyCompatible } from "@/lib/product-types";

const rawProducts: ProductBase[] = [
  {
    id: "poster-chaos",
    slug: "poster-chaos",
    name: "Chaos Poster",
    description: "Poster sperimentale per interni.",
    coverImage: "/products/poster-chaos/front.jpg",
    galleryImages: [
      "/products/poster-chaos/front.jpg",
      "/products/poster-chaos/back.jpg",
      "/products/poster-chaos/detail-1.jpg",
    ],
    variants: [
      {
        id: "poster-chaos-a4",
        name: "A4",
        sku: "CHAOS-A4",
        priceEUR: 0.5,
        stock: 25,
        images: [
          "/products/poster-chaos/front.jpg",
          "/products/poster-chaos/back.jpg",
        ],
        isDefault: true,
      },
      {
        id: "poster-chaos-a3",
        name: "A3",
        sku: "CHAOS-A3",
        priceEUR: 18,
        stock: 12,
        images: [
          "/products/poster-chaos/front.jpg",
          "/products/poster-chaos/back.jpg",
        ],
      },
    ],
  },
  {
    id: "poster-noise",
    slug: "poster-noise",
    name: "Noise Poster",
    description: "Poster grafico ad alto contrasto.",
    coverImage: "/products/poster-noise/front.jpg",
    galleryImages: [
      "/products/poster-noise/front.jpg",
      "/products/poster-noise/back.jpg",
      "/products/poster-noise/detail-1.jpg",
    ],
    variants: [
      {
        id: "poster-noise-a4",
        name: "A4",
        sku: "NOISE-A4",
        priceEUR: 16,
        stock: 18,
        images: [
          "/products/poster-noise/front.jpg",
          "/products/poster-noise/back.jpg",
        ],
        isDefault: true,
      },
      {
        id: "poster-noise-a3",
        name: "A3",
        sku: "NOISE-A3",
        priceEUR: 24,
        stock: 8,
        images: [
          "/products/poster-noise/front.jpg",
          "/products/poster-noise/back.jpg",
        ],
      },
    ],
  },
  {
    id: "poster-fragment",
    slug: "poster-fragment",
    name: "Fragment Poster",
    description: "Poster visivo con composizione astratta.",
    coverImage: "/products/poster-fragment/front.jpg",
    galleryImages: [
      "/products/poster-fragment/front.jpg",
      "/products/poster-fragment/back.jpg",
      "/products/poster-fragment/detail-1.jpg",
    ],
    variants: [
      {
        id: "poster-fragment-a4",
        name: "A4",
        sku: "FRAGMENT-A4",
        priceEUR: 14,
        stock: 30,
        images: [
          "/products/poster-fragment/front.jpg",
          "/products/poster-fragment/back.jpg",
        ],
        isDefault: true,
      },
      {
        id: "poster-fragment-a3",
        name: "A3",
        sku: "FRAGMENT-A3",
        priceEUR: 22,
        stock: 10,
        images: [
          "/products/poster-fragment/front.jpg",
          "/products/poster-fragment/back.jpg",
        ],
      },
    ],
  },
];

function getDefaultVariant(product: ProductBase) {
  return (
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0]
  );
}

export const products: ProductLegacyCompatible[] = rawProducts.map((product) => {
  const defaultVariant = getDefaultVariant(product);

  return {
    ...product,
    defaultVariantId: defaultVariant.id,

    // campi legacy mantenuti per non rompere il codice attuale
    priceEUR: defaultVariant.priceEUR,
    frontImage: defaultVariant.images[0] ?? product.coverImage,
    backImage:
      defaultVariant.images[1] ??
      product.galleryImages[1] ??
      product.coverImage,
  };
});

export function getProductById(id: string) {
  return products.find((product) => product.id === id) ?? null;
}

export function getVariantById(productId: string, variantId: string) {
  const product = getProductById(productId);
  if (!product) return null;

  return product.variants.find((variant) => variant.id === variantId) ?? null;
}

export function getDefaultVariantByProductId(productId: string) {
  const product = getProductById(productId);
  if (!product) return null;

  return (
    product.variants.find((variant) => variant.id === product.defaultVariantId) ??
    product.variants[0] ??
    null
  );
}

export function isProductInStock(productId: string) {
  const variant = getDefaultVariantByProductId(productId);
  if (!variant) return false;
  return variant.stock > 0;
}