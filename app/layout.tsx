import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { getAllActiveProductsForUI } from "@/lib/products-db";

export const metadata: Metadata = {
  title: "shit-shop",
  description: "shit-shop",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await getAllActiveProductsForUI();

  return (
    <html lang="en">
      <body>
        <CartProvider products={products}>{children}</CartProvider>
      </body>
    </html>
  );
}