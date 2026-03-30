"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  if (pathname === "/maintenance") {
    return null;
  }

  const isOrdersPage = pathname === "/orders";
  const isLoginPage = pathname === "/login";

  return (
    <header
      style={{
        height: 76,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "0 24px",
        borderBottom: "1px solid rgba(0,0,0,.08)",
        background: "#fff",
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          color: "#111",
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        shit-shop
      </Link>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 15,
        }}
      >
        <Link href="/orders">Ordini</Link>

        {isOrdersPage ? (
          <form action="/api/logout" method="post">
            <button
              type="submit"
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                margin: 0,
                color: "#551A8B",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Logout
            </button>
          </form>
        ) : !isLoginPage ? (
          <Link href="/login">Login</Link>
        ) : null}
      </nav>
    </header>
  );
}