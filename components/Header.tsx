import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function Header() {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 28px",
        borderBottom: "1px solid rgba(0,0,0,.08)",
        background: "#fff",
      }}
    >
      <Link
        href="/"
        style={{
          fontWeight: 900,
          textDecoration: "none",
          color: "#111",
        }}
      >
        shit-shop
      </Link>

      <nav style={{ display: "flex", gap: 14 }}>
        {!user && (
          <Link
            href="/login"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,.12)",
              textDecoration: "none",
              color: "#111",
              fontWeight: 700,
            }}
          >
            Login
          </Link>
        )}

        {user && (
          <>
            <Link
              href="/orders"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,.12)",
                textDecoration: "none",
                color: "#111",
                fontWeight: 700,
              }}
            >
              I tuoi ordini
            </Link>

            <form action="/api/logout" method="post">
              <button
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,.12)",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Logout
              </button>
            </form>
          </>
        )}
      </nav>
    </header>
  );
}