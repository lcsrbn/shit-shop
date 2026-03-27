"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function OrderStatusSelect({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus ?? "pending");
  const [isPending, startTransition] = useTransition();

  function updateStatus(newStatus: string) {
    const previousStatus = status;

    console.log("UPDATE_STATUS_CLICK", {
      orderId,
      previousStatus,
      newStatus,
      basePath: BASE_PATH,
      url: `${BASE_PATH}/api/admin/orders/update-status`,
    });

    setStatus(newStatus);

    startTransition(async () => {
      try {
        const url = `${BASE_PATH}/api/admin/orders/update-status`;

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
        console.log("UPDATE_STATUS_RESPONSE", {
          status: res.status,
          ok: res.ok,
          body: text,
        });

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