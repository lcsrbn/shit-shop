import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";

export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

async function requireAdminSession() {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }
}

export default async function AdminNewProductPage() {
  await requireAdminSession();

  return (
    <main style={{ padding: 30, maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop admin</div>

          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 34,
              fontWeight: 950,
              letterSpacing: "-0.03em",
            }}
          >
            New Product
          </h1>

          <p style={{ marginTop: 10, opacity: 0.75 }}>
            Create a product and its first variant.
          </p>
        </div>

        <Link
          href="/admin/products"
          style={{
            display: "inline-block",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "10px 14px",
            color: "#111",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← Back to products
        </Link>
      </div>

      <ProductCreateForm />
    </main>
  );
}