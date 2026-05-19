import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import SiteChrome from "@/components/SiteChrome";
import Header from "@/components/Header";
import { getAllActiveProductsForUI } from "@/lib/products-db";

export const metadata: Metadata = {
  title: "shit-shop",
  description: "shit-shop",
};

function LayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <SiteChrome />
    </>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await getAllActiveProductsForUI();

  return (
    <html lang="en">
      <body>
        <CartProvider products={products}>
          <LayoutInner>{children}</LayoutInner>
        </CartProvider>
      </body>
    </html>
  );
}