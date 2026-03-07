"use client";

import { usePathname } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";

export default function SiteChrome() {
  const pathname = usePathname();

  if (pathname === "/maintenance") {
    return null;
  }

  return <CartDrawer />;
}