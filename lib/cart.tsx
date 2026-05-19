"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Product, ProductVariant } from "@/lib/product-types";
import {
  getDefaultVariantByProductId,
  getProductById,
  getVariantById,
} from "@/lib/products";

type LegacyCartItem = {
  id: string;
  qty: number;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
};

type CartDetailedItem = {
  key: string;
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  product: Product;
  variant: ProductVariant;
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

function clampQty(qty: unknown) {
  const parsed = Math.floor(Number(qty));
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(99, parsed));
}

function normalize(
  products: Product[],
  items: Array<CartItem | LegacyCartItem>
): CartItem[] {
  const mapped = (items ?? [])
    .map((item) => {
      if (!item || typeof item.qty === "undefined") return null;

      if ("productId" in item && "variantId" in item) {
        const productId = String(item.productId);
        const variantId = String(item.variantId);
        const qty = clampQty(item.qty);

        const product = getProductById(products, productId);
        const variant = getVariantById(product, variantId);

        if (!product || !variant) return null;

        return {
          id: productId,
          productId,
          variantId,
          qty,
        } satisfies CartItem;
      }

      if ("id" in item) {
        const productId = String(item.id);
        const defaultVariant = getDefaultVariantByProductId(products, productId);
        const qty = clampQty(item.qty);

        if (!productId || !defaultVariant) return null;

        return {
          id: productId,
          productId,
          variantId: defaultVariant.id,
          qty,
        } satisfies CartItem;
      }

      return null;
    })
    .filter((item): item is CartItem => item !== null);

  mapped.sort((a, b) => {
    const ak = itemKey(a.productId, a.variantId);
    const bk = itemKey(b.productId, b.variantId);

    return ak < bk ? -1 : ak > bk ? 1 : 0;
  });

  return mapped;
}

function safeParse(products: Product[], raw: string | null): CartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return normalize(products, parsed as Array<CartItem | LegacyCartItem>);
  } catch {
    return [];
  }
}

function serialize(products: Product[], items: CartItem[]) {
  return JSON.stringify(normalize(products, items));
}

function readStorage(products: Product[]): { items: CartItem[]; raw: string } {
  if (typeof window === "undefined") {
    return { items: [], raw: "[]" };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";

  return {
    items: safeParse(products, raw),
    raw,
  };
}

export function CartProvider({
  children,
  products,
}: {
  children: React.ReactNode;
  products: Product[];
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const lastSavedRawRef = useRef<string>("[]");
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const { items: fromStorage, raw } = readStorage(products);

    lastSavedRawRef.current = raw;
    setItems(fromStorage);
    setReady(true);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BC_NAME);
      bcRef.current = bc;

      bc.onmessage = (ev) => {
        const msg = ev.data as { type: string; raw?: string } | null;

        if (!msg || msg.type !== "CART_SYNC" || typeof msg.raw !== "string") {
          return;
        }

        lastSavedRawRef.current = msg.raw;
        setItems(safeParse(products, msg.raw));
      };
    }

    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;

      const raw = e.newValue ?? "[]";
      lastSavedRawRef.current = raw;
      setItems(safeParse(products, raw));
    }

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);

      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, [products]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;

    const raw = serialize(products, items);

    if (raw === lastSavedRawRef.current) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
      lastSavedRawRef.current = raw;
      bcRef.current?.postMessage({ type: "CART_SYNC", raw });
    } catch {}
  }, [items, products, ready]);

  const api = useMemo<CartApi>(() => {
    const norm = normalize(products, items);

    const detailedItems: CartDetailedItem[] = norm
      .map((item) => {
        const product = getProductById(products, item.productId);
        const variant = getVariantById(product, item.variantId);

        if (!product || !variant) return null;

        return {
          key: itemKey(item.productId, item.variantId),
          id: item.productId,
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
          product,
          variant,
          lineEUR: variant.priceEUR * item.qty,
        };
      })
      .filter((item): item is CartDetailedItem => item !== null);

    const count = norm.reduce((acc, item) => acc + item.qty, 0);
    const subtotalEUR = detailedItems.reduce(
      (acc, item) => acc + item.lineEUR,
      0
    );

    function add(productId: string, variantId: string, qty = 1) {
      const q = clampQty(qty);

      setItems((prev) => {
        const base = normalize(products, prev);
        const idx = base.findIndex(
          (item) => item.productId === productId && item.variantId === variantId
        );

        if (idx === -1) {
          return normalize(products, [
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

        return normalize(products, next);
      });
    }

    function setQty(productId: string, variantId: string, qty: number) {
      const q = clampQty(qty);

      setItems((prev) => {
        const base = normalize(products, prev);
        const idx = base.findIndex(
          (item) => item.productId === productId && item.variantId === variantId
        );

        if (idx === -1) return base;

        const next = [...base];
        next[idx] = { ...next[idx], qty: q };

        return normalize(products, next);
      });
    }

    function remove(productId: string, variantId: string) {
      setItems((prev) =>
        normalize(products, prev).filter(
          (item) =>
            !(item.productId === productId && item.variantId === variantId)
        )
      );
    }

    function clear() {
      setItems([]);
    }

    function replaceAll(nextItems: Array<CartItem | LegacyCartItem>) {
      setItems(normalize(products, nextItems));
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
  }, [items, products, ready]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);

  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }

  return ctx;
}