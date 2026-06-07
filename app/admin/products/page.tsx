import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCatalogProducts, type CatalogVariant } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const ADMIN_COOKIE = "shit_shop_admin_session";

function formatEUR(value: number | string | null | undefined) {
  if (value == null) return "—";

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(numberValue);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-US");
  } catch {
    return value;
  }
}

function getPriceRange(variants: CatalogVariant[]) {
  const prices = variants
    .map((variant) => Number(variant.price_eur))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) return "—";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return formatEUR(min);

  return `${formatEUR(min)} – ${formatEUR(max)}`;
}

function getTotalStock(variants: CatalogVariant[]) {
  return variants.reduce((total, variant) => {
    return total + Math.max(0, Number(variant.stock_quantity ?? 0));
  }, 0);
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }
}

export default async function AdminProductsPage() {
  await requireAdminSession();

  const products = await getCatalogProducts();

  return (
    <main style={{ padding: 30, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
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
            Admin Products
          </h1>

          <p style={{ marginTop: 10, opacity: 0.75 }}>
            Manage product visibility, variants, stock, and pricing.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/admin/orders"
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
            Orders
          </Link>

          <Link
            href="/"
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
            View shop
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18, opacity: 0.75, fontSize: 14 }}>
        Products found: <b>{products.length}</b>
      </div>

      <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
        {products.length === 0 ? (
          <section
            style={{
              border: "1px solid rgba(0,0,0,.10)",
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,.92)",
            }}
          >
            <p style={{ margin: 0, opacity: 0.8 }}>No products found.</p>
          </section>
        ) : (
          products.map((product) => {
            const activeVariants = product.variants.filter(
              (variant) => variant.is_active
            );

            return (
              <section
                key={product.id}
                style={{
                  border: "1px solid rgba(0,0,0,.10)",
                  borderRadius: 18,
                  padding: 18,
                  background: "rgba(255,255,255,.92)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "96px minmax(260px, 1.4fr) minmax(150px, .7fr) minmax(150px, .7fr) auto",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,.10)",
                      background: "#fff",
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          opacity: 0.55,
                          textAlign: "center",
                          padding: 8,
                        }}
                      >
                        No image
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Product</div>

                    <div style={{ fontWeight: 950, fontSize: 18 }}>
                      {product.name}
                    </div>

                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                      Slug: {product.slug}
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                      Public ID: {product.public_id ?? "—"}
                    </div>

                    <div style={{ marginTop: 10, opacity: 0.8 }}>
                      {product.short_description ??
                        product.description ??
                        "No description."}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 13, opacity: 0.65 }}>
                      Updated: {formatDate(product.updated_at)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Status</div>

                    <div
                      style={{
                        display: "inline-flex",
                        marginTop: 6,
                        borderRadius: 999,
                        padding: "7px 10px",
                        background: product.is_active
                          ? "rgba(0,128,0,.10)"
                          : "rgba(0,0,0,.06)",
                        fontWeight: 900,
                      }}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
                      Sort: {product.sort_order ?? 0}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Catalog</div>

                    <div style={{ marginTop: 6, fontWeight: 900 }}>
                      {product.variants.length} variants
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.8 }}>
                      {activeVariants.length} active
                    </div>

                    <div style={{ marginTop: 10, fontWeight: 900 }}>
                      Stock: {getTotalStock(product.variants)}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.8 }}>
                      {getPriceRange(product.variants)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <Link
                      href={`/admin/products/${product.id}`}
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
                      Edit
                    </Link>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}