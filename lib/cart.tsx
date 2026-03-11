"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getDefaultVariantByProductId,
  getProductById,
  getVariantById,
  products,
} from "@/lib/products";

type LegacyCartItem = {
  id: string;
  qty: number;
};

export type CartItem = {
  id: string; // alias legacy = productId
  productId: string;
  variantId: string;
  qty: number;
};

type CartDetailedItem = {
  key: string;
  id: string; // alias legacy = productId
  productId: string;
  variantId: string;
  qty: number;
  product: (typeof products)[number];
  variant: NonNullable<ReturnType<typeof getVariantById>>;
  lineEUR: number;
};

type CartApi = {
  items: CartItem[];
  detailedItems: CartDetailedItem[];
  count: number;
  subtotalEUR: number;
  ready: boolean;

  add: (productId: string, variantId: string, qty?: number) => void;
  setQty: (productId: string, variantId: string, qty: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
  replaceAll: (items: Array<CartItem | LegacyCartItem>) => void;
};

const CartCtx = createContext<CartApi | null>(null);

const STORAGE_KEY = "floating_shop_cart_v3";
const BC_NAME = "floating_shop_cart_bc";

function itemKey(productId: string, variantId: string) {
  return `${productId}__${variantId}`;
}

function normalize(items: Array<CartItem | LegacyCartItem>): CartItem[] {
  const mapped = (items ?? [])
    .map((x) => {
      if (!x || typeof x.qty === "undefined") return null;

      // formato nuovo
      if ("productId" in x && "variantId" in x) {
        const productId = String(x.productId);
        const variantId = String(x.variantId);
        const qty = Math.max(1, Math.min(99, Math.floor(Number(x.qty))));

        if (!productId || !variantId || !Number.isFinite(qty)) return null;

        return {
          id: productId,
          productId,
          variantId,
          qty,
        } satisfies CartItem;
      }

      // formato legacy: { id, qty }
      if ("id" in x) {
        const productId = String(x.id);
        const defaultVariant = getDefaultVariantByProductId(productId);
        const qty = Math.max(1, Math.min(99, Math.floor(Number(x.qty))));

        if (!productId || !defaultVariant || !Number.isFinite(qty)) return null;

        return {
          id: productId,
          productId,
          variantId: defaultVariant.id,
          qty,
        } satisfies CartItem;
      }

      return null;
    })
    .filter(Boolean) as CartItem[];

  mapped.sort((a, b) => {
    const ak = itemKey(a.productId, a.variantId);
    const bk = itemKey(b.productId, b.variantId);
    return ak < bk ? -1 : ak > bk ? 1 : 0;
  });

  return mapped;
}

function safeParse(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalize(parsed as Array<CartItem | LegacyCartItem>);
  } catch {
    return [];
  }
}

function serialize(items: CartItem[]) {
  return JSON.stringify(normalize(items));
}

function readStorage(): { items: CartItem[]; raw: string } {
  if (typeof window === "undefined") return { items: [], raw: "[]" };
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  return { items: safeParse(raw), raw };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const lastSavedRawRef = useRef<string>("[]");
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const { items: fromStorage, raw } = readStorage();
    lastSavedRawRef.current = raw;
    setItems(fromStorage);
    setReady(true);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BC_NAME);
      bcRef.current = bc;

      bc.onmessage = (ev) => {
        const msg = ev.data as { type: string; raw?: string } | null;
        if (!msg || msg.type !== "CART_SYNC" || typeof msg.raw !== "string") return;
        lastSavedRawRef.current = msg.raw;
        setItems(safeParse(msg.raw));
      };
    }

    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      const raw2 = e.newValue ?? "[]";
      lastSavedRawRef.current = raw2;
      setItems(safeParse(raw2));
    }

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;

    const raw = serialize(items);
    if (raw === lastSavedRawRef.current) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
      lastSavedRawRef.current = raw;
      bcRef.current?.postMessage({ type: "CART_SYNC", raw });
    } catch {}
  }, [items, ready]);

  const api = useMemo<CartApi>(() => {
    const norm = normalize(items);

    const detailedItems: CartDetailedItem[] = norm
      .map((it) => {
        const product = getProductById(it.productId);
        const variant = getVariantById(it.productId, it.variantId);

        if (!product || !variant) return null;

        return {
          key: itemKey(it.productId, it.variantId),
          id: it.productId,
          productId: it.productId,
          variantId: it.variantId,
          qty: it.qty,
          product,
          variant,
          lineEUR: variant.priceEUR * it.qty,
        };
      })
      .filter(Boolean) as CartDetailedItem[];

    const count = norm.reduce((acc, it) => acc + it.qty, 0);
    const subtotalEUR = detailedItems.reduce((acc, it) => acc + it.lineEUR, 0);

    function add(productId: string, variantId: string, qty = 1) {
      const q = Math.max(1, Math.min(99, Math.floor(qty)));

      setItems((prev) => {
        const base = normalize(prev);
        const idx = base.findIndex(
          (x) => x.productId === productId && x.variantId === variantId
        );

        if (idx === -1) {
          return normalize([
            ...base,
            {
              id: productId,
              productId,
              variantId,
              qty: q,
            },
          ]);
        }

        const next = [...base];
        next[idx] = {
          ...next[idx],
          qty: Math.min(99, next[idx].qty + q),
        };
        return normalize(next);
      });
    }

    function setQty(productId: string, variantId: string, qty: number) {
      const q = Math.max(1, Math.min(99, Math.floor(qty)));

      setItems((prev) => {
        const base = normalize(prev);
        const idx = base.findIndex(
          (x) => x.productId === productId && x.variantId === variantId
        );

        if (idx === -1) return base;

        const next = [...base];
        next[idx] = { ...next[idx], qty: q };
        return normalize(next);
      });
    }

    function remove(productId: string, variantId: string) {
      setItems((prev) =>
        normalize(prev).filter(
          (x) => !(x.productId === productId && x.variantId === variantId)
        )
      );
    }

    function clear() {
      setItems([]);
    }

    function replaceAll(nextItems: Array<CartItem | LegacyCartItem>) {
      setItems(normalize(nextItems));
    }

    return {
      items: norm,
      detailedItems,
      count,
      subtotalEUR,
      ready,
      add,
      setQty,
      remove,
      clear,
      replaceAll,
    };
  }, [items, ready]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}