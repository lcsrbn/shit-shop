"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalOrders, type LocalOrder } from "@/lib/order";
import { products } from "@/lib/products";

export default function OrdersClient() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    setOrders(readLocalOrders());
  }, []);

  const detailed = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      lines: order.items
        .map((it) => {
          const p = products.find((x) => x.id === it.id);
          if (!p) return null;
          return {
            id: it.id,
            name: p.name,
            qty: it.qty,
            lineEUR: p.priceEUR * it.qty,
          };
        })
        .filter(Boolean) as Array<{ id: string; name: string; qty: number; lineEUR: number }>,
    }));
  }, [orders]);

  if (detailed.length === 0) {
    return (
      <div style={{ border: "1px solid rgba(0,0,0,.10)", borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 950 }}>Nessun ordine salvato</div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          Completa un pagamento test e comparirà qui.
        </div>
        <div style={{ marginTop: 12 }}>
          <a href="/">Torna alla home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {detailed.map((order) => (
        <section
          key={order.id}
          style={{
            border: "1px solid rgba(0,0,0,.10)",
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,.92)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div>
              <div style={{ fontWeight: 950 }}>Ordine {order.id}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                {new Date(order.savedAt).toLocaleString("it-IT")}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(0,0,0,.06)",
              }}
            >
              {order.status}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {order.lines.map((line) => (
              <div
                key={line.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderTop: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 900 }}>{line.name}</span>{" "}
                  <span style={{ opacity: 0.7 }}>× {line.qty}</span>
                </div>
                <div style={{ fontWeight: 900 }}>€{line.lineEUR.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(0,0,0,.10)",
              marginTop: 10,
              paddingTop: 10,
            }}
          >
            <div style={{ fontWeight: 950 }}>Totale</div>
            <div style={{ fontWeight: 950 }}>€{order.subtotalEUR.toFixed(2)}</div>
          </div>
        </section>
      ))}
    </div>
  );
}