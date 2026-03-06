"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { readPendingOrder } from "@/lib/order";

export default function CancelClient() {
  const cart = useCart();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const pending = readPendingOrder();
    if (pending?.items?.length) {
      cart.replaceAll(pending.items);
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 950, marginBottom: 8 }}>
        {restored ? "Carrello ripristinato" : "Nessun carrello da ripristinare"}
      </div>
      <div style={{ fontSize: 13, opacity: 0.72 }}>
        {restored
          ? "Abbiamo rimesso i prodotti nel carrello così puoi riprovare."
          : "Puoi tornare alla home e ricominciare."}
      </div>
    </div>
  );
}