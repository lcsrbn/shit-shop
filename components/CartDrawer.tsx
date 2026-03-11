"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

declare global {
  interface Window {
    __openCart?: () => void;
  }
}

const HEADER_HEIGHT = 72;

export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const disabled = cart.detailedItems.length === 0;

  const [pulse, setPulse] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    window.__openCart = () => setOpen(true);
    return () => {
      if (window.__openCart) delete window.__openCart;
    };
  }, []);

  useEffect(() => {
    if (cart.count !== lastCount) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 350);
      setLastCount(cart.count);
      return () => clearTimeout(t);
    }
  }, [cart.count, lastCount]);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            right: 18,
            top: HEADER_HEIGHT + 18,
            zIndex: 9999,
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.15)",
            background: "rgba(255,255,255,.92)",
            padding: "12px 14px",
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(0,0,0,.15)",
            fontWeight: 900,
            transform: pulse ? "scale(1.08)" : "scale(1)",
            transition: "transform 180ms ease",
          }}
          title="Apri carrello"
        >
          🛒 {cart.count}
        </button>
      )}

      {open && (
        <div
          onMouseDown={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(10px)",
            display: "grid",
            placeItems: "end",
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100vw)",
              height: "100vh",
              background: "rgba(255,255,255,.96)",
              borderLeft: "1px solid rgba(0,0,0,.12)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 950 }}>Carrello</div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,.12)",
                  background: "rgba(255,255,255,.9)",
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                Chiudi
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", paddingRight: 4 }}>
              {cart.detailedItems.length === 0 ? (
                <div style={{ opacity: 0.7 }}>Il carrello è vuoto.</div>
              ) : (
                cart.detailedItems.map(({ key, product, variant, qty, lineEUR }) => (
                  <div
                    key={key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "72px 1fr auto",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(0,0,0,.08)",
                      alignItems: "center",
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
                        src={variant.images[0] ?? product.frontImage}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div>
                      <div style={{ fontWeight: 900 }}>{product.name}</div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>
                        Variante: {variant.name}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>
                        €{variant.priceEUR.toFixed(2)} cad.
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() =>
                            cart.setQty(product.id, variant.id, Math.max(1, qty - 1))
                          }
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

                        <div style={{ minWidth: 26, textAlign: "center", fontWeight: 900 }}>
                          {qty}
                        </div>

                        <button
                          onClick={() =>
                            cart.setQty(product.id, variant.id, Math.min(99, qty + 1))
                          }
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

                        <button
                          onClick={() => cart.remove(product.id, variant.id)}
                          style={{
                            marginLeft: 6,
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,.12)",
                            background: "#fff",
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>

                    <div style={{ fontWeight: 900 }}>€{lineEUR.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: "1px solid rgba(0,0,0,.10)", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
                <div>Subtotale</div>
                <div>€{cart.subtotalEUR.toFixed(2)}</div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  onClick={cart.clear}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,.12)",
                    background: "rgba(255,255,255,.9)",
                    padding: "12px 14px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                    fontWeight: 800,
                  }}
                >
                  Svuota
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    router.push("/checkout");
                  }}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: 0,
                    background: "#0b0b0b",
                    color: "#fff",
                    padding: "12px 14px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                    fontWeight: 950,
                  }}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}