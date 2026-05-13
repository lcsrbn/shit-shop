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
        {restored ? "Cart restored" : "No cart to restore"}
      </div>
      <div style={{ fontSize: 13, opacity: 0.72 }}>
        {restored
          ? "We put the items back in your cart so you can try again."
          : "You can go back to the home page and start over."}
      </div>
    </div>
  );
}