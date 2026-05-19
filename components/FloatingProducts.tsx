"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart";

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  product: Product;
};

type FloatingProductsProps = {
  initialProducts: Product[];
};

type OverlayState =
  | { open: false }
  | {
      open: true;
      product: Product;
      selectedVariantId: string;
      rect: {
        left: number;
        top: number;
        width: number;
        height: number;
        rotate: number;
      };
      stage: "from-card" | "centered";
      flipped: boolean;
      qty: number;
    };

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function resolveAABB(a: Body, b: Body) {
  const dx = a.x - b.x;
  const px = a.size / 2 + b.size / 2 - Math.abs(dx);
  if (px <= 0) return;

  const dy = a.y - b.y;
  const py = a.size / 2 + b.size / 2 - Math.abs(dy);
  if (py <= 0) return;

  if (px < py) {
    const sx = dx < 0 ? -1 : 1;
    const push = px * sx;
    a.x += push / 2;
    b.x -= push / 2;

    const av = a.vx;
    a.vx = b.vx * 0.92;
    b.vx = av * 0.92;

    a.vrot += rand(-25, 25);
    b.vrot += rand(-25, 25);
  } else {
    const sy = dy < 0 ? -1 : 1;
    const push = py * sy;
    a.y += push / 2;
    b.y -= push / 2;

    const av = a.vy;
    a.vy = b.vy * 0.92;
    b.vy = av * 0.92;

    a.vrot += rand(-25, 25);
    b.vrot += rand(-25, 25);
  }
}

function getDefaultVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.id === product.defaultVariantId) ??
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0] ??
    null
  );
}

function getProductVariant(product: Product, variantId: string) {
  return product.variants.find((variant) => variant.id === variantId) ?? null;
}

export default function FloatingProducts({
  initialProducts,
}: FloatingProductsProps) {
  const cart = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  const bodiesRef = useRef<Body[]>([]);
  const [bodies, setBodies] = useState<Body[]>([]);

  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);

  const draggingIndex = useRef<number | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouse = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragDistance = useRef<number>(0);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [overlay, setOverlay] = useState<OverlayState>({ open: false });
  const overlayOpen = overlay.open;

  const initProducts = useMemo(() => initialProducts, [initialProducts]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    bodiesRef.current = initProducts.map((product) => ({
      product,
      size: 220,
      x: rand(140, Math.max(280, width - 140)),
      y: rand(140, Math.max(280, height - 140)),
      vx: rand(-140, 140),
      vy: rand(-120, 120),
      rot: rand(-10, 10),
      vrot: rand(-30, 30),
    }));

    setBodies([...bodiesRef.current]);

    const getMousePos = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();

      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    };

    const pickBodyAt = (x: number, y: number) => {
      const items = bodiesRef.current;

      for (let i = items.length - 1; i >= 0; i--) {
        const body = items[i];
        const half = body.size / 2;

        if (
          x >= body.x - half &&
          x <= body.x + half &&
          y >= body.y - half &&
          y <= body.y + half
        ) {
          return i;
        }
      }

      return null;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (overlayOpen) return;

      const { x, y } = getMousePos(e);
      const index = pickBodyAt(x, y);

      if (index === null) return;

      draggingIndex.current = index;

      const body = bodiesRef.current[index];
      dragOffset.current = {
        x: x - body.x,
        y: y - body.y,
      };

      bodiesRef.current = [
        ...bodiesRef.current.slice(0, index),
        ...bodiesRef.current.slice(index + 1),
        body,
      ];

      draggingIndex.current = bodiesRef.current.length - 1;

      lastMouse.current = {
        x,
        y,
        t: performance.now(),
      };

      dragDistance.current = 0;

      body.vx = 0;
      body.vy = 0;
      body.vrot *= 0.2;

      setBodies([...bodiesRef.current]);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (draggingIndex.current === null) return;

      const now = performance.now();
      const { x, y } = getMousePos(e);
      const index = draggingIndex.current;
      const body = bodiesRef.current[index];

      const previousMouse = lastMouse.current;

      if (previousMouse) {
        const dt = Math.max(0.001, (now - previousMouse.t) / 1000);
        const vx = (x - previousMouse.x) / dt;
        const vy = (y - previousMouse.y) / dt;

        body.vx = body.vx * 0.6 + vx * 0.4;
        body.vy = body.vy * 0.6 + vy * 0.4;
        body.vrot = body.vrot * 0.6 + vx * 0.008 * 0.4;

        dragDistance.current += Math.hypot(
          x - previousMouse.x,
          y - previousMouse.y
        );
      }

      lastMouse.current = {
        x,
        y,
        t: now,
      };

      body.x = x - dragOffset.current.x;
      body.y = y - dragOffset.current.y;
    };

    const onMouseUp = () => {
      draggingIndex.current = null;
      lastMouse.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOverlay({ open: false });
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);

    const step = (time: number) => {
      if (!lastTRef.current) {
        lastTRef.current = time;
      }

      const dt = clamp((time - lastTRef.current) / 1000, 0, 0.033);
      lastTRef.current = time;

      if (overlayOpen) {
        setBodies([...bodiesRef.current]);
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const stageWidth = containerRect.width;
      const stageHeight = containerRect.height;

      const items = bodiesRef.current;

      for (let i = 0; i < items.length; i++) {
        const body = items[i];
        const isDragging =
          draggingIndex.current !== null && i === draggingIndex.current;

        if (!isDragging) {
          body.x += body.vx * dt;
          body.y += body.vy * dt;
          body.rot += body.vrot * dt;

          body.vx *= 0.999;
          body.vy *= 0.999;
          body.vrot *= 0.998;
        }

        const half = body.size / 2;

        if (body.x - half < 0) {
          body.x = half;
          body.vx = Math.abs(body.vx) * 0.95;
          body.vrot += rand(-18, 18);
        } else if (body.x + half > stageWidth) {
          body.x = stageWidth - half;
          body.vx = -Math.abs(body.vx) * 0.95;
          body.vrot += rand(-18, 18);
        }

        if (body.y - half < 0) {
          body.y = half;
          body.vy = Math.abs(body.vy) * 0.95;
          body.vrot += rand(-18, 18);
        } else if (body.y + half > stageHeight) {
          body.y = stageHeight - half;
          body.vy = -Math.abs(body.vy) * 0.95;
          body.vrot += rand(-18, 18);
        }
      }

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          resolveAABB(items[i], items[j]);
        }
      }

      setBodies([...items]);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [initProducts, overlayOpen]);

  function openOverlay(product: Product, rotate: number) {
    const el = cardRefs.current[product.id];

    if (!el) return;

    const defaultVariant = getDefaultVariant(product);

    if (!defaultVariant) return;

    const rect = el.getBoundingClientRect();

    setOverlay({
      open: true,
      product,
      selectedVariantId: defaultVariant.id,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        rotate,
      },
      stage: "from-card",
      flipped: false,
      qty: 1,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOverlay((previous) =>
          previous.open ? { ...previous, stage: "centered" } : previous
        );
      });
    });
  }

  function closeOverlay() {
    setOverlay({ open: false });
  }

  function toggleFlip() {
    setOverlay((previous) =>
      previous.open ? { ...previous, flipped: !previous.flipped } : previous
    );
  }

  const expandedWidth = "min(560px, calc(100vw - 28px))";
  const expandedHeight = "min(820px, calc(100vh - 28px))";

  const selectedVariant = overlay.open
    ? getProductVariant(overlay.product, overlay.selectedVariantId)
    : null;

  if (initProducts.length === 0) {
    return (
      <section
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 20,
          background: "rgba(255,255,255,.92)",
        }}
      >
        <p style={{ margin: 0 }}>No products available.</p>
      </section>
    );
  }

  return (
    <>
      <div ref={containerRef} className="stage">
        <div className="hint">drag & throw · click = open · click card = flip</div>

        {bodies.map((body) => (
          <div
            key={body.product.id}
            ref={(node) => {
              cardRefs.current[body.product.id] = node;
            }}
            className="fcard"
            onClick={() => {
              if (dragDistance.current > 6) return;
              openOverlay(body.product, body.rot);
            }}
            style={{
              left: body.x,
              top: body.y,
              transform: `translate(-50%,-50%) rotate(${body.rot}deg)`,
            }}
          >
            <div className="fcardTop">
              <img src={body.product.frontImage} alt={body.product.name} />
            </div>

            <div className="fcardMeta">
              <div>
                <div className="fcardTitle">{body.product.name}</div>
                <div className="fcardPrice">
                  €{body.product.priceEUR.toFixed(2)}
                </div>
              </div>

              <div className="pill">open</div>
            </div>
          </div>
        ))}
      </div>

      {overlay.open && selectedVariant && (
        <div className="overlay" onMouseDown={closeOverlay}>
          <div
            className="expandWrap"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              left: overlay.stage === "from-card" ? overlay.rect.left : "50%",
              top: overlay.stage === "from-card" ? overlay.rect.top : "50%",
              width:
                overlay.stage === "from-card"
                  ? overlay.rect.width
                  : expandedWidth,
              height:
                overlay.stage === "from-card"
                  ? overlay.rect.height
                  : expandedHeight,
              transform:
                overlay.stage === "from-card"
                  ? `translate(0,0) rotate(${overlay.rect.rotate}deg)`
                  : "translate(-50%, -50%) rotate(0deg)",
            }}
          >
            <div className="flipStage">
              <div
                className={`flipCard ${overlay.flipped ? "isFlipped" : ""}`}
                onClick={toggleFlip}
              >
                <div className="face frontShell">
                  <div className="cardTopbar">
                    <button
                      className="btnGhost"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeOverlay();
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <div className="frontBody">
                    <div className="bigTitle">{overlay.product.name}</div>

                    <div className="hero">
                      <img
                        src={
                          selectedVariant.images[0] ??
                          overlay.product.frontImage
                        }
                        alt={overlay.product.name}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 12,
                        marginBottom: 12,
                      }}
                    >
                      {overlay.product.variants.map((variant) => {
                        const active = variant.id === overlay.selectedVariantId;
                        const outOfStock = variant.stock <= 0;

                        return (
                          <button
                            key={variant.id}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (outOfStock) return;

                              setOverlay((previous) =>
                                previous.open
                                  ? {
                                      ...previous,
                                      selectedVariantId: variant.id,
                                      qty: Math.min(previous.qty, variant.stock),
                                    }
                                  : previous
                              );
                            }}
                            style={{
                              borderRadius: 999,
                              border: active
                                ? "1px solid #111"
                                : "1px solid rgba(0,0,0,.12)",
                              background: active ? "#111" : "#fff",
                              color: active ? "#fff" : "#111",
                              padding: "8px 12px",
                              cursor: outOfStock ? "not-allowed" : "pointer",
                              opacity: outOfStock ? 0.45 : 1,
                              fontWeight: 800,
                            }}
                          >
                            {variant.name}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div className="priceLine">
                        € {selectedVariant.priceEUR.toFixed(2)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            setOverlay((previous) =>
                              previous.open
                                ? {
                                    ...previous,
                                    qty: Math.max(1, previous.qty - 1),
                                  }
                                : previous
                            );
                          }}
                          style={{
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,.12)",
                            background: "#fff",
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          −
                        </button>

                        <div
                          style={{
                            minWidth: 26,
                            textAlign: "center",
                            fontWeight: 900,
                          }}
                        >
                          {overlay.qty}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            setOverlay((previous) =>
                              previous.open
                                ? {
                                    ...previous,
                                    qty: Math.min(
                                      selectedVariant.stock,
                                      Math.min(99, previous.qty + 1)
                                    ),
                                  }
                                : previous
                            );
                          }}
                          style={{
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,.12)",
                            background: "#fff",
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                      Stock available: {selectedVariant.stock}
                    </div>

                    <div className="desc">{overlay.product.description}</div>

                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          if (selectedVariant.stock <= 0) {
                            alert("This variant is out of stock");
                            return;
                          }

                          cart.add(
                            overlay.product.id,
                            selectedVariant.id,
                            overlay.qty
                          );

                          setOverlay({ open: false });

                          setTimeout(() => {
                            window.__openCart?.();
                          }, 50);
                        }}
                        style={{
                          width: "100%",
                          borderRadius: 999,
                          border: 0,
                          background: "#0b0b0b",
                          color: "#fff",
                          padding: "12px 14px",
                          cursor:
                            selectedVariant.stock <= 0
                              ? "not-allowed"
                              : "pointer",
                          opacity: selectedVariant.stock <= 0 ? 0.6 : 1,
                          fontWeight: 950,
                        }}
                      >
                        {selectedVariant.stock <= 0
                          ? "Out of stock"
                          : "Add to cart"}
                      </button>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                      Checkout from the cart.
                    </div>
                  </div>
                </div>

                <div className="face back">
                  <div className="cardTopbar">
                    <button
                      className="btnGhost"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeOverlay();
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <div className="backFull">
                    <img
                      src={selectedVariant.images[1] ?? overlay.product.backImage}
                      alt={`${overlay.product.name} secondary`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}