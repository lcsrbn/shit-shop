"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { savePendingOrder } from "@/lib/order";

export default function CheckoutClient() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cart.ready) return;
    if (cart.count === 0) {
      router.replace("/");
    }
  }, [cart.ready, cart.count, router]);

  const rows = useMemo(() => cart.detailedItems, [cart.detailedItems]);
  const disabled = !cart.ready || rows.length === 0 || loading;

  async function goStripe() {
    if (disabled) return;

    setLoading(true);

    const orderId = `ord_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    savePendingOrder({
      id: orderId,
      createdAt: Date.now(),
      items: cart.items.map((x) => ({ id: x.id, qty: x.qty })),
      subtotalEUR: cart.subtotalEUR,
    });

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map((x) => ({ id: x.id, qty: x.qty })),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(`Checkout error: ${data?.error ?? res.statusText}`);
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    alert("Stripe session error");
    setLoading(false);
  }

  if (!cart.ready) {
    return <div style={{ padding: "40px 0", opacity: 0.6 }}>Caricamento checkout…</div>;
  }

  if (cart.count === 0) {
    return <div style={{ padding: "40px 0", opacity: 0.6 }}>Carrello vuoto — reindirizzamento…</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gap: 18,
        marginTop: 18,
      }}
    >
      <section
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 16,
          background: "rgba(255,255,255,.90)",
        }}
      >
        <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Prodotti</div>

        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "84px 1fr auto",
              gap: 12,
              padding: "12px 0",
              borderTop: "1px solid rgba(0,0,0,.08)",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,.10)",
                background: "#fff",
              }}
            >
              <img
                src={row.product.frontImage}
                alt={row.product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 950 }}>{row.product.name}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>€{row.product.priceEUR} cad.</div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                <button
                  onClick={() => cart.setQty(row.product.id, Math.max(1, row.qty - 1))}
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,.12)",
                    background: "#fff",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  −
                </button>

                <div style={{ minWidth: 28, textAlign: "center", fontWeight: 950 }}>{row.qty}</div>

                <button
                  onClick={() => cart.setQty(row.product.id, Math.min(99, row.qty + 1))}
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,.12)",
                    background: "#fff",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  +
                </button>

                <button
                  onClick={() => cart.remove(row.product.id)}
                  style={{
                    marginLeft: 6,
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,.12)",
                    background: "#fff",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Rimuovi
                </button>
              </div>
            </div>

            <div style={{ fontWeight: 950 }}>€{row.lineEUR.toFixed(2)}</div>
          </div>
        ))}
      </section>

      <aside
        style={{
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 16,
          background: "rgba(255,255,255,.90)",
          height: "fit-content",
          position: "sticky",
          top: 18,
        }}
      >
        <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>Riepilogo</div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
          <div style={{ opacity: 0.75 }}>Subtotale</div>
          <div style={{ fontWeight: 950 }}>€{cart.subtotalEUR.toFixed(2)}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
          <div style={{ opacity: 0.75 }}>Spedizione</div>
          <div style={{ fontWeight: 950 }}>—</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,.10)", marginTop: 8, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Totale</div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>€{cart.subtotalEUR.toFixed(2)}</div>
          </div>

          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
            Tasse e spedizione verranno gestite più avanti.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={cart.clear}
            style={{
              flex: 1,
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,.12)",
              background: "rgba(255,255,255,.9)",
              padding: "12px 14px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Svuota
          </button>

          <button
            onClick={goStripe}
            disabled={disabled}
            style={{
              flex: 1.2,
              borderRadius: 999,
              border: 0,
              background: "#0b0b0b",
              color: "#fff",
              padding: "12px 14px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontWeight: 950,
              opacity: disabled ? 0.75 : 1,
            }}
          >
            {loading ? "Apro Stripe…" : "Vai al pagamento"}
          </button>
        </div>
      </aside>
    </div>
  );
}