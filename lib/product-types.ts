export type ProductVariant = {
    id: string;
    name: string;
    sku: string;
    priceEUR: number;
    stock: number;
    images: string[];
    isDefault?: boolean;
  };
  
  export type ProductBase = {
    id: string;
    slug: string;
    name: string;
    description?: string;
    coverImage: string;
    galleryImages: string[];
    variants: ProductVariant[];
  };
  
  export type ProductLegacyCompatible = ProductBase & {
    frontImage: string;
    backImage: string;
    priceEUR: number;
    defaultVariantId: string;
  };