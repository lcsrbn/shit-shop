"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { products } from "@/lib/products";

export type CartItem = { id: string; qty: number };

type CartDetailedItem = {
  id: string;
  qty: number;
  product: (typeof products)[number];
  lineEUR: number;
};

type CartApi = {
  items: CartItem[];
  detailedItems: CartDetailedItem[];
  count: number;
  subtotalEUR: number;
  ready: boolean;

  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  replaceAll: (items: CartItem[]) => void;
};

const CartCtx = createContext<CartApi | null>(null);

const STORAGE_KEY = "floating_shop_cart_v2";
const BC_NAME = "floating_shop_cart_bc";

function normalize(items: CartItem[]): CartItem[] {
  const clean = (items ?? [])
    .filter((x) => x && typeof x.id === "string")
    .map((x) => ({ id: x.id, qty: Math.max(1, Math.min(99, Math.floor(Number(x.qty)))) }))
    .filter((x) => Number.isFinite(x.qty) && x.qty > 0);

  clean.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return clean;
}

function safeParse(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalize(parsed as any);
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
        const product = products.find((p) => p.id === it.id);
        if (!product) return null;
        return { id: it.id, qty: it.qty, product, lineEUR: product.priceEUR * it.qty };
      })
      .filter(Boolean) as CartDetailedItem[];

    const count = norm.reduce((acc, it) => acc + it.qty, 0);
    const subtotalEUR = detailedItems.reduce((acc, it) => acc + it.lineEUR, 0);

    function add(id: string, qty = 1) {
      const q = Math.max(1, Math.min(99, Math.floor(qty)));
      setItems((prev) => {
        const base = normalize(prev);
        const idx = base.findIndex((x) => x.id === id);
        if (idx === -1) return normalize([...base, { id, qty: q }]);
        const next = [...base];
        next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + q) };
        return normalize(next);
      });
    }

    function setQty(id: string, qty: number) {
      const q = Math.max(1, Math.min(99, Math.floor(qty)));
      setItems((prev) => {
        const base = normalize(prev);
        const idx = base.findIndex((x) => x.id === id);
        if (idx === -1) return base;
        const next = [...base];
        next[idx] = { ...next[idx], qty: q };
        return normalize(next);
      });
    }

    function remove(id: string) {
      setItems((prev) => normalize(prev).filter((x) => x.id !== id));
    }

    function clear() {
      setItems([]);
    }

    function replaceAll(nextItems: CartItem[]) {
      setItems(normalize(nextItems));
    }

    return { items: norm, detailedItems, count, subtotalEUR, ready, add, setQty, remove, clear, replaceAll };
  }, [items, ready]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}