"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearPendingOrder } from "@/lib/order";
import { useCart } from "@/lib/cart";

export default function SuccessClient() {
  const cart = useCart();

  useEffect(() => {
    clearPendingOrder();
    cart.clear();
  }, [cart]);

  return (
    <div
      style={{
        marginTop: 18,
        border: "1px solid rgba(0,0,0,.10)",
        borderRadius: 18,
        padding: 18,
        background: "rgba(255,255,255,.92)",
      }}
    >
      <p style={{ margin: 0, opacity: 0.8 }}>
        Grazie per l’acquisto. Ti contatteremo con gli aggiornamenti dell’ordine.
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Link
          href="/"
          style={{
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "12px 16px",
            textDecoration: "none",
            color: "#111",
            fontWeight: 800,
          }}
        >
          Torna allo shop
        </Link>

        <Link
          href="/orders"
          style={{
            borderRadius: 999,
            border: 0,
            background: "#0b0b0b",
            color: "#fff",
            padding: "12px 16px",
            textDecoration: "none",
            fontWeight: 900,
          }}
        >
          Vedi ordini
        </Link>
      </div>
    </div>
  );
}