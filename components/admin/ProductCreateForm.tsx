"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [product, setProduct] = useState({
    name: "",
    slug: "",
    public_id: "",
    short_description: "",
    description: "",
    image_url: "",
    sort_order: "0",
    seo_title: "",
    seo_description: "",
    is_active: true,
  });

  const [variant, setVariant] = useState({
    name: "Default",
    public_id: "",
    sku: "",
    price_eur: "0",
    stock_quantity: "0",
    is_active: true,
  });

  const suggestedSlug = useMemo(() => slugify(product.name), [product.name]);

  function applySlugSuggestion() {
    const nextSlug = suggestedSlug;

    setProduct((prev) => ({
      ...prev,
      slug: nextSlug,
      public_id: prev.public_id || nextSlug,
    }));

    setVariant((prev) => ({
      ...prev,
      public_id: prev.public_id || `${nextSlug}-default`,
      sku: prev.sku || `${nextSlug.toUpperCase()}-DEFAULT`,
    }));
  }

  function createProduct() {
    startTransition(async () => {
      const res = await fetch("/api/admin/products/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: {
            ...product,
            sort_order: Number(product.sort_order),
          },
          variant: {
            ...variant,
            price_eur: Number(variant.price_eur),
            stock_quantity: Number(variant.stock_quantity),
          },
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Failed to create product");
        return;
      }

      if (!payload?.productId) {
        alert("Product created, but missing product id");
        router.push("/admin/products");
        return;
      }

      router.push(`/admin/products/${payload.productId}`);
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
              value={product.name}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, name: e.target.value }))
              }
              style={fieldStyle()}
              placeholder="Chaos Poster"
            />
          </label>

          <div>
            <button
              type="button"
              onClick={applySlugSuggestion}
              disabled={!suggestedSlug}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,.12)",
                background: "#fff",
                padding: "8px 12px",
                color: "#111",
                fontWeight: 800,
                cursor: suggestedSlug ? "pointer" : "not-allowed",
                opacity: suggestedSlug ? 1 : 0.5,
              }}
            >
              Generate slug/public IDs
            </button>
          </div>

          <label style={labelStyle()}>
            Slug
            <input
              value={product.slug}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, slug: e.target.value }))
              }
              style={fieldStyle()}
              placeholder="chaos-poster"
            />
          </label>

          <label style={labelStyle()}>
            Product public ID
            <input
              value={product.public_id}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, public_id: e.target.value }))
              }
              style={fieldStyle()}
              placeholder="poster-chaos"
            />
          </label>

          <label style={labelStyle()}>
            Short description
            <input
              value={product.short_description}
              onChange={(e) =>
                setProduct((prev) => ({
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
              value={product.description}
              onChange={(e) =>
                setProduct((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            Image URL
            <input
              value={product.image_url}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, image_url: e.target.value }))
              }
              style={fieldStyle()}
              placeholder="/products/example/front.jpg"
            />
          </label>

          <label style={labelStyle()}>
            Sort order
            <input
              type="number"
              value={product.sort_order}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, sort_order: e.target.value }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            SEO title
            <input
              value={product.seo_title}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, seo_title: e.target.value }))
              }
              style={fieldStyle()}
            />
          </label>

          <label style={labelStyle()}>
            SEO description
            <textarea
              value={product.seo_description}
              onChange={(e) =>
                setProduct((prev) => ({
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
              checked={product.is_active}
              onChange={(e) =>
                setProduct((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
            />
            Active product
          </label>
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
        <h2 style={{ marginTop: 0 }}>First Variant</h2>

        <div style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle()}>
            Variant name
            <input
              value={variant.name}
              onChange={(e) =>
                setVariant((prev) => ({ ...prev, name: e.target.value }))
              }
              style={fieldStyle()}
              placeholder="A4"
            />
          </label>

          <label style={labelStyle()}>
            Variant public ID
            <input
              value={variant.public_id}
              onChange={(e) =>
                setVariant((prev) => ({
                  ...prev,
                  public_id: e.target.value,
                }))
              }
              style={fieldStyle()}
              placeholder="poster-chaos-a4"
            />
          </label>

          <label style={labelStyle()}>
            SKU
            <input
              value={variant.sku}
              onChange={(e) =>
                setVariant((prev) => ({ ...prev, sku: e.target.value }))
              }
              style={fieldStyle()}
              placeholder="CHAOS-A4"
            />
          </label>

          <label style={labelStyle()}>
            Price EUR
            <input
              type="number"
              step="0.01"
              value={variant.price_eur}
              onChange={(e) =>
                setVariant((prev) => ({ ...prev, price_eur: e.target.value }))
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
                setVariant((prev) => ({
                  ...prev,
                  stock_quantity: e.target.value,
                }))
              }
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
              checked={variant.is_active}
              onChange={(e) =>
                setVariant((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
            />
            Active variant
          </label>
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={createProduct}
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
          Create product
        </button>
      </div>
    </div>
  );
}