import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import SiteChrome from "@/components/SiteChrome";
import Header from "@/components/Header";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <CartProvider>
          <LayoutInner>{children}</LayoutInner>
        </CartProvider>
      </body>
    </html>
  );
}