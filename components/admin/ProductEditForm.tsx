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

const emptyNewVariant = {
  name: "",
  public_id: "",
  sku: "",
  price_eur: "",
  stock_quantity: "",
  is_active: true,
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

  const [newVariant, setNewVariant] = useState(emptyNewVariant);
  const [newVariantError, setNewVariantError] = useState("");

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

  function deactivateProduct() {
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
          is_active: false,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Failed to deactivate product");
        return;
      }

      router.refresh();
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

  function deactivateVariant(variantId: string) {
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
          is_active: false,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Failed to deactivate variant");
        return;
      }

      router.refresh();
    });
  }

  function createVariant() {
    const name = newVariant.name.trim();
    const public_id = newVariant.public_id.trim();
    const sku = newVariant.sku.trim();
    const price = Number(newVariant.price_eur);
    const stock = Number(newVariant.stock_quantity);

    if (!name) {
      setNewVariantError("Variant name is required.");
      return;
    }
    if (!public_id) {
      setNewVariantError("Public ID is required.");
      return;
    }
    if (!sku) {
      setNewVariantError("SKU is required.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setNewVariantError("Price must be 0 or greater.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setNewVariantError("Stock must be a whole number 0 or greater.");
      return;
    }

    setNewVariantError("");

    startTransition(async () => {
      const res = await fetch("/api/admin/products/create-variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name,
          public_id,
          sku,
          price_eur: price,
          stock_quantity: stock,
          is_active: newVariant.is_active,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setNewVariantError(payload?.error ?? "Failed to create variant.");
        return;
      }

      setNewVariant(emptyNewVariant);
      router.refresh();
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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

            {product.is_active === true && (
              <button
                type="button"
                onClick={deactivateProduct}
                disabled={isPending}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(192,57,43,.45)",
                  background: "rgba(192,57,43,.06)",
                  color: "#c0392b",
                  padding: "12px 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                Deactivate product
              </button>
            )}
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

                <div style={{ display: "flex", gap: 8 }}>
                  {variant.is_active && (
                    <button
                      type="button"
                      onClick={() => deactivateVariant(variant.id)}
                      disabled={isPending}
                      style={{
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,.18)",
                        background: "rgba(0,0,0,.04)",
                        padding: "10px 14px",
                        color: "#555",
                        fontWeight: 800,
                        cursor: "pointer",
                        opacity: isPending ? 0.6 : 1,
                      }}
                    >
                      Deactivate
                    </button>
                  )}

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
              </div>
            </article>
          ))}

          <article
            style={{
              border: "1px dashed rgba(0,0,0,.18)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 12,
                opacity: 0.65,
              }}
            >
              Add new variant
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 120px 120px",
                gap: 12,
                alignItems: "end",
              }}
            >
              <label style={labelStyle()}>
                Variant name
                <input
                  value={newVariant.name}
                  onChange={(e) =>
                    setNewVariant((prev) => ({ ...prev, name: e.target.value }))
                  }
                  style={fieldStyle()}
                />
              </label>

              <label style={labelStyle()}>
                Public ID
                <input
                  value={newVariant.public_id}
                  onChange={(e) =>
                    setNewVariant((prev) => ({
                      ...prev,
                      public_id: e.target.value,
                    }))
                  }
                  style={fieldStyle()}
                />
              </label>

              <label style={labelStyle()}>
                SKU
                <input
                  value={newVariant.sku}
                  onChange={(e) =>
                    setNewVariant((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  style={fieldStyle()}
                />
              </label>

              <label style={labelStyle()}>
                Price EUR
                <input
                  type="number"
                  step="0.01"
                  value={newVariant.price_eur}
                  onChange={(e) =>
                    setNewVariant((prev) => ({
                      ...prev,
                      price_eur: e.target.value,
                    }))
                  }
                  style={fieldStyle()}
                />
              </label>

              <label style={labelStyle()}>
                Stock
                <input
                  type="number"
                  value={newVariant.stock_quantity}
                  onChange={(e) =>
                    setNewVariant((prev) => ({
                      ...prev,
                      stock_quantity: e.target.value,
                    }))
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                    checked={newVariant.is_active}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                  Active variant
                </label>

                {newVariantError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#c0392b",
                      fontWeight: 700,
                    }}
                  >
                    {newVariantError}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={createVariant}
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
                Add variant
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
