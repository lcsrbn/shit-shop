"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();

  if (pathname === "/maintenance") {
    return null;
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        background: "rgba(255,255,255,.85)",
        borderBottom: "1px solid rgba(0,0,0,.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#111",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          shit-shop
        </Link>

        <nav style={{ display: "flex", gap: 14 }}>
          <Link href="/orders">Ordini</Link>
          <Link href="/login">Login</Link>
          <Link href="/admin/orders">Admin</Link>
        </nav>
      </div>
    </header>
  );
}