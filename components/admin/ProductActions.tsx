"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ProductSnapshot = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean | null;
};

export function ProductActions({ product }: { product: ProductSnapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function duplicateProduct() {
    startTransition(async () => {
      const res = await fetch("/api/admin/products/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Failed to duplicate product");
        return;
      }

      router.push(`/admin/products/${payload.productId}`);
    });
  }

  function deactivateProduct() {
    startTransition(async () => {
      const res = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          short_description: product.short_description ?? "",
          description: product.description ?? "",
          image_url: product.image_url ?? "",
          sort_order: product.sort_order ?? 0,
          seo_title: product.seo_title ?? "",
          seo_description: product.seo_description ?? "",
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

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={duplicateProduct}
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
        Duplicate product
      </button>

      {product.is_active && (
        <button
          type="button"
          onClick={deactivateProduct}
          disabled={isPending}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(180,0,0,.30)",
            background: "rgba(180,0,0,.05)",
            padding: "10px 14px",
            color: "#900",
            fontWeight: 800,
            cursor: "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          Deactivate product
        </button>
      )}
    </div>
  );
}
