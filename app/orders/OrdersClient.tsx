"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readLocalOrders, type LocalOrder } from "@/lib/order";
import { products } from "@/lib/products";

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString("it-IT");
  } catch {
    return "";
  }
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    setOrders(readLocalOrders());
  }, []);

  if (orders.length === 0) {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,.92)",
        }}
      >
        <p style={{ margin: 0, opacity: 0.8 }}>Nessun ordine salvato in questo browser.</p>

        <div style={{ marginTop: 16 }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
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
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {orders.map((order) => (
        <section
          key={order.id}
          style={{
            border: "1px solid rgba(0,0,0,.10)",
            borderRadius: 18,
            padding: 18,
            background: "rgba(255,255,255,.92)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "baseline",
            }}
          >
            <div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>Ordine</div>
              <div style={{ fontWeight: 950 }}>{order.id}</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, opacity: 0.65 }}>Salvato il</div>
              <div style={{ fontWeight: 900 }}>{formatDate(order.savedAt)}</div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {order.items.map((item) => {
              const product = products.find((p) => p.id === item.id);
              if (!product) return null;

              return (
                <div
                  key={`${order.id}-${item.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: "1px solid rgba(0,0,0,.08)",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,.10)",
                      background: "#fff",
                    }}
                  >
                    <img
                      src={product.frontImage}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 900 }}>{product.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      Quantità: {item.qty} · €{product.priceEUR.toFixed(2)} cad.
                    </div>
                  </div>

                  <div style={{ fontWeight: 900 }}>
                    €{(product.priceEUR * item.qty).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(0,0,0,.10)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "8px 12px",
                background: "rgba(0,0,0,.05)",
                fontWeight: 800,
              }}
            >
              Stato: {order.status}
            </div>

            <div style={{ fontWeight: 950, fontSize: 18 }}>
              Totale: €{order.subtotalEUR.toFixed(2)}
            </div>
          </div>
        </section>
      ))}

      <div style={{ marginTop: 6 }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
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
      </div>
    </div>
  );
}