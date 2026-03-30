"use client";

import { usePathname } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";

export default function SiteChrome() {
  const pathname = usePathname();

  const isMaintenancePage = pathname === "/maintenance";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isMaintenancePage || isAdminRoute) {
    return null;
  }

  return <CartDrawer />;
}