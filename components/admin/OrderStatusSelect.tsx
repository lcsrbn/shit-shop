"use client";

import { useState, useTransition } from "react";

export function OrderStatusSelect({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string | null;
}) {
  const [status, setStatus] = useState(initialStatus ?? "pending");
  const [isPending, startTransition] = useTransition();

  function updateStatus(newStatus: string) {
    const previousStatus = status;
    setStatus(newStatus);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            status: newStatus,
          }),
        });

        if (!res.ok) {
          setStatus(previousStatus);
          throw new Error("Update failed");
        }
      } catch (err) {
        console.error(err);
        alert("Errore aggiornamento stato");
      }
    });
  }

  return (
    <select
      value={status}
      onChange={(e) => updateStatus(e.target.value)}
      disabled={isPending}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,.14)",
        background: "#fff",
      }}
    >
      <option value="pending">pending</option>
      <option value="paid">paid</option>
      <option value="shipped">shipped</option>
      <option value="failed">failed</option>
      <option value="cancelled">cancelled</option>
    </select>
  );
}