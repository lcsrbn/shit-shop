"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ProductVariantRow = {
  id: string;
  public_id: string | null;
  name: string;
  sku: string;
  price_eur: number | string | null;
  stock_quantity: number | null;
  is_active: boolean | null;
};

type ProductRow = {
  id: string;
  public_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  variants: ProductVariantRow[];
};

function fieldStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,.14)",
    background: "#fff",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 800,
  };
}

export function ProductEditForm({ product }: { product: ProductRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [productState, setProductState] = useState({
    name: product.name,
    slug: product.slug,
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    sort_order: String(product.sort_order ?? 0),
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    is_active: Boolean(product.is_active),
  });

  const [variants, setVariants] = useState(
    product.variants.map((variant) => ({
      id: variant.id,
      public_id: variant.public_id ?? "",
      name: variant.name,
      sku: variant.sku,
      price_eur: String(variant.price_eur ?? "0"),
      stock_quantity: String(variant.stock_quantity ?? 0),
      is_active: Boolean(variant.is_active),
    }))
  );

  function updateProduct() {
    startTransition(async () => {
      const res = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          ...productState,
          sort_order: Number(productState.sort_order),
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Failed to update product");
        return;
      }

      router.refresh();
      alert("Product updated");
    });
  }

  function updateVariant(variantId: string) {
    const variant = variants.find((item) => item.id === variantId);
    if (!variant) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/products/update-variant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId: variant.id,
          name: variant.name,
          sku: variant.sku,
          price_eur: Number(variant.price_eur),
          stock_quantity: Number(variant.stock_quantity),
          is_active: variant.is_active,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Failed to update variant");
        return;
      }

      router.refresh();
      alert("Variant updated");
    });
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,.92)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Product</h2>

        <div style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle()}>
            Name
            <input
              value={productState.name}
              onChange={(e) =>
                setProductState((prev) => ({ ...prev, name: e.target.value }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            Slug
            <input
              value={productState.slug}
              onChange={(e) =>
                setProductState((prev) => ({ ...prev, slug: e.target.value }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            Short description
            <input
              value={productState.short_description}
              onChange={(e) =>
                setProductState((prev) => ({
                  ...prev,
                  short_description: e.target.value,
                }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            Description
            <textarea
              value={productState.description}
              onChange={(e) =>
                setProductState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            Sort order
            <input
              type="number"
              value={productState.sort_order}
              onChange={(e) =>
                setProductState((prev) => ({
                  ...prev,
                  sort_order: e.target.value,
                }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            SEO title
            <input
              value={productState.seo_title}
              onChange={(e) =>
                setProductState((prev) => ({
                  ...prev,
                  seo_title: e.target.value,
                }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            SEO description
            <textarea
              value={productState.seo_description}
              onChange={(e) =>
                setProductState((prev) => ({
                  ...prev,
                  seo_description: e.target.value,
                }))
              }
              rows={3}
              style={fieldStyle()}
            />
          </label>

          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              fontWeight: 800,
            }}
          >
            <input
              type="checkbox"
              checked={productState.is_active}
              onChange={(e) =>
                setProductState((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
            />
            Active product
          </label>

          <div>
            <button
              type="button"
              onClick={updateProduct}
              disabled={isPending}
              style={{
                borderRadius: 999,
                border: 0,
                background: "#111",
                color: "#fff",
                padding: "12px 16px",
                fontWeight: 900,
                cursor: "pointer",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              Save product
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,.92)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Variants</h2>

        <div style={{ display: "grid", gap: 14 }}>
          {variants.map((variant, index) => (
            <article
              key={variant.id}
              style={{
                border: "1px solid rgba(0,0,0,.10)",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 120px",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                <label style={labelStyle()}>
                  Variant name
                  <input
                    value={variant.name}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label style={labelStyle()}>
                  SKU
                  <input
                    value={variant.sku}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, sku: e.target.value } : item
                        )
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label style={labelStyle()}>
                  Price EUR
                  <input
                    type="number"
                    step="0.01"
                    value={variant.price_eur}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, price_eur: e.target.value }
                            : item
                        )
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label style={labelStyle()}>
                  Stock
                  <input
                    type="number"
                    value={variant.stock_quantity}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, stock_quantity: e.target.value }
                            : item
                        )
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    gap: 8,
                    alignItems: "center",
                    fontWeight: 800,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, is_active: e.target.checked }
                            : item
                        )
                      )
                    }
                  />
                  Active variant
                </label>

                <button
                  type="button"
                  onClick={() => updateVariant(variant.id)}
                  disabled={isPending}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,.12)",
                    background: "#fff",
                    padding: "10px 14px",
                    color: "#111",
                    fontWeight: 800,
                    cursor: "pointer",
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  Save variant
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}