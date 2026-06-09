"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogMedia, ProductMediaType } from "@/lib/catalog";

type Props = {
  productId: string;
  initialMedia: CatalogMedia[];
};

function groupMedia(media: CatalogMedia[], type: ProductMediaType) {
  return media
    .filter((item) => item.type === type && item.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function sectionStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(0,0,0,.10)",
    borderRadius: 18,
    padding: 18,
    background: "rgba(255,255,255,.92)",
  };
}

export function ProductMediaManager({ productId, initialMedia }: Props) {
  const router = useRouter();
  const [media, setMedia] = useState(initialMedia);
  const [isPending, startTransition] = useTransition();

  async function upload(file: File, type: ProductMediaType) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);
    formData.append("type", type);

    startTransition(async () => {
      const res = await fetch("/api/admin/products/media/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Upload failed");
        return;
      }

      setMedia((prev) => {
        const filtered =
          type === "main" || type === "sprite"
            ? prev.filter((item) => item.type !== type)
            : prev;

        return [...filtered, payload.media];
      });

      router.refresh();
    });
  }

  async function remove(mediaId: string) {
    startTransition(async () => {
      const res = await fetch("/api/admin/products/media/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaId }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        alert(payload?.error ?? "Delete failed");
        return;
      }

      setMedia((prev) => prev.filter((item) => item.id !== mediaId));
      router.refresh();
    });
  }

  const main = groupMedia(media, "main");
  const details = groupMedia(media, "detail");
  const sprite = groupMedia(media, "sprite");

  function uploadInput(type: ProductMediaType, disabled = false) {
    return (
      <input
        type="file"
        accept="image/*"
        disabled={isPending || disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.currentTarget.value = "";

          if (file) {
            upload(file, type);
          }
        }}
      />
    );
  }

  function renderMediaItem(item: CatalogMedia) {
    return (
      <article
        key={item.id}
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 120,
            height: item.type === "sprite" ? 120 : 160,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,.10)",
            background: "#fff",
          }}
        >
          <img
            src={item.url}
            alt={item.alt ?? item.type}
            style={{
              width: "100%",
              height: "100%",
              objectFit: item.type === "sprite" ? "contain" : "cover",
              imageRendering: item.type === "sprite" ? "pixelated" : "auto",
            }}
          />
        </div>

        <div style={{ fontSize: 12, opacity: 0.65, wordBreak: "break-all" }}>
          {item.type} · sort {item.sort_order}
        </div>

        <button
          type="button"
          onClick={() => remove(item.id)}
          disabled={isPending}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "8px 12px",
            color: "#111",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Remove
        </button>
      </article>
    );
  }

  return (
    <section style={sectionStyle()}>
      <h2 style={{ marginTop: 0 }}>Product Media</h2>

      <div style={{ display: "grid", gap: 22 }}>
        <div>
          <h3>Main image</h3>
          <p style={{ opacity: 0.7, marginTop: 0 }}>
            Used in the normal shop, checkout preview, and product cards.
          </p>

          {uploadInput("main")}

          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
            {main.length === 0 ? (
              <p style={{ opacity: 0.65 }}>No main image.</p>
            ) : (
              main.map(renderMediaItem)
            )}
          </div>
        </div>

        <div>
          <h3>Detail images</h3>
          <p style={{ opacity: 0.7, marginTop: 0 }}>
            Up to 5 product detail images.
          </p>

          {uploadInput("detail", details.length >= 5)}

          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
            {details.length}/5 detail images
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {details.length === 0 ? (
              <p style={{ opacity: 0.65 }}>No detail images.</p>
            ) : (
              details.map(renderMediaItem)
            )}
          </div>
        </div>

        <div>
          <h3>RPG sprite</h3>
          <p style={{ opacity: 0.7, marginTop: 0 }}>
            Used later as the object sprite inside the RPG world.
          </p>

          {uploadInput("sprite")}

          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
            {sprite.length === 0 ? (
              <p style={{ opacity: 0.65 }}>No sprite uploaded.</p>
            ) : (
              sprite.map(renderMediaItem)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}