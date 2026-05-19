"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readLocalOrders, type LocalOrder } from "@/lib/order";

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString("en-US");
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
        <p style={{ margin: 0, opacity: 0.8 }}>
          No orders saved in this browser.
        </p>

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
            Back to shop
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
              <div style={{ fontSize: 13, opacity: 0.65 }}>Order</div>
              <div style={{ fontWeight: 950 }}>{order.id}</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, opacity: 0.65 }}>Saved</div>
              <div style={{ fontWeight: 900 }}>{formatDate(order.savedAt)}</div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {order.items.length === 0 ? (
              <div
                style={{
                  padding: "10px 0",
                  borderTop: "1px solid rgba(0,0,0,.08)",
                  opacity: 0.7,
                }}
              >
                No local line items available.
              </div>
            ) : (
              order.items.map((item) => (
                <div
                  key={`${order.id}-${item.productId}-${item.variantId}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: "1px solid rgba(0,0,0,.08)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>
                      Product ID: {item.productId}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      Variant ID: {item.variantId} · Qty: {item.qty}
                    </div>
                  </div>
                </div>
              ))
            )}
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
              Status: {order.status}
            </div>

            <div style={{ fontWeight: 950, fontSize: 18 }}>
              Total: €{order.subtotalEUR.toFixed(2)}
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
          Back to shop
        </Link>
      </div>
    </div>
  );
}