"use client";

import { useEffect } from "react";
import {
  clearPendingOrder,
  readPendingOrder,
  saveLocalOrder,
} from "@/lib/order";
import { useCart } from "@/lib/cart";

export default function SuccessClient() {
  const cart = useCart();

  useEffect(() => {
    const pending = readPendingOrder();

    if (pending) {
      saveLocalOrder(pending);
      clearPendingOrder();
    }

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
        Grazie per l’acquisto. Il pagamento è stato ricevuto correttamente.
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "12px 16px",
            color: "#111",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Torna allo shop
        </button>

        <button
          onClick={() => {
            window.location.href = "/orders";
          }}
          style={{
            borderRadius: 999,
            border: 0,
            background: "#0b0b0b",
            color: "#fff",
            padding: "12px 16px",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Vedi ordini
        </button>
      </div>
    </div>
  );
}