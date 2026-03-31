"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ORDER_STATUSES,
  getOrderStatusLabel,
  normalizeOrderStatus,
  type OrderStatus,
} from "@/lib/order";

export function OrderStatusSelect({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(
    normalizeOrderStatus(initialStatus)
  );
  const [isPending, startTransition] = useTransition();

  function updateStatus(newStatus: OrderStatus) {
    const previousStatus = status;
    const url = "/api/admin/orders/update-status";

    setStatus(newStatus);

    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            status: newStatus,
          }),
        });

        const text = await res.text();
        let payload: any = null;

        try {
          payload = text ? JSON.parse(text) : null;
        } catch {}

        if (!res.ok) {
          setStatus(previousStatus);
          alert(payload?.error ?? `Errore aggiornamento stato (${res.status})`);
          return;
        }

        router.refresh();
      } catch (err) {
        console.error("UPDATE_STATUS_FETCH_ERROR", err);
        setStatus(previousStatus);
        alert("Errore aggiornamento stato");
      }
    });
  }

  return (
    <select
      value={status}
      onChange={(e) => updateStatus(e.target.value as OrderStatus)}
      disabled={isPending}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,.14)",
        background: "#fff",
      }}
    >
      {ORDER_STATUSES.map((value) => (
        <option key={value} value={value}>
          {getOrderStatusLabel(value)}
        </option>
      ))}
    </select>
  );
}