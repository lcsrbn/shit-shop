import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "shit-shop",
  description: "shit-shop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}