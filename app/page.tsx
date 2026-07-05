import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { getAllActiveProductsForUI } from "@/lib/products-db";
import WorldGame from "@/components/world/WorldGame";

const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "shit-shop",
  description: "A habitat for nostalgia.",
};

export default async function Page() {
  const products = await getAllActiveProductsForUI();

  // The OLD HOODIE in the back room maps to a real product so it can
  // cross into the other plane (the cart). Prefer an actual hoodie.
  const match =
    products.find((p) => /hoodie/i.test(`${p.name} ${p.slug}`)) ??
    products[0] ??
    null;

  const product = match
    ? {
        id: match.id,
        variantId: match.defaultVariantId,
        name: match.name,
        priceEUR: match.priceEUR,
      }
    : null;

  // Catalog for the in-game terminal shop.
  const catalog = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    priceEUR: p.priceEUR,
    defaultVariantId: p.defaultVariantId,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      priceEUR: v.priceEUR,
      stock: v.stock,
    })),
  }));

  return (
    <div className={pixelFont.className}>
      <WorldGame product={product} catalog={catalog} />
    </div>
  );
}
