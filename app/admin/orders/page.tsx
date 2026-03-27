import { redirect } from "next/navigation";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  order_id: string | null;
  user_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  tax_code: string | null;
  order_note: string | null;
  currency: string | null;
  amount_total: number | null;
  items_json: unknown;
};

type OrderItemRow = {
  productName: string;
  variantName: string;
  qty: number;
  unitPriceEUR: number;
  lineTotalEUR: number;
};

function normalizeItemsJson(value: unknown): OrderItemRow[] {
  const mapItem = (item: any): OrderItemRow | null => {
    if (!item || typeof item !== "object") return null;

    const qty = Number(item.qty ?? item.quantity ?? 1);
    const price = Number(item.price ?? item.unitPriceEUR ?? 0);

    return {
      productName: item.name ?? item.productName ?? "Prodotto",
      variantName: item.variant ?? item.variantName ?? "Default",
      qty,
      unitPriceEUR: price,
      lineTotalEUR: Number(item.lineTotalEUR ?? qty * price),
    };
  };

  if (Array.isArray(value)) return value.map(mapItem).filter(Boolean) as any;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(mapItem).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  if (value && typeof value === "object") {
    const single = mapItem(value);
    return single ? [single] : [];
  }

  return [];
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value / 100);
}

async function getOrders() {
  const supabase = await getSupabaseServerAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as OrderRow[]) ?? [];
}

export default async function Page({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const orders = await getOrders();

  const statusFilter = searchParams.status ?? "all";
  const query = (searchParams.q ?? "").toLowerCase();

  const filtered = orders.filter((o) => {
    const matchStatus =
      statusFilter === "all" || o.status === statusFilter;

    const matchQuery =
      !query ||
      o.order_id?.toLowerCase().includes(query) ||
      o.customer_email?.toLowerCase().includes(query);

    return matchStatus && matchQuery;
  });

  return (
    <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>Admin Orders</h1>

      {/* FILTERS */}
      <form style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input
          name="q"
          placeholder="Cerca email o order id..."
          defaultValue={searchParams.q ?? ""}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            flex: 1,
          }}
        />

        <select
          name="status"
          defaultValue={statusFilter}
          style={{ padding: 10, borderRadius: 8 }}
        >
          <option value="all">Tutti</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <button type="submit">Filtra</button>
      </form>

      {/* ORDERS */}
      <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
        {filtered.map((order) => {
          const items = normalizeItemsJson(order.items_json);

          return (
            <div
              key={order.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 900 }}>
                {order.order_id ?? order.id}
              </div>

              <div style={{ fontSize: 14, opacity: 0.7 }}>
                {order.customer_email}
              </div>

              <div>
                Stato: <b>{order.status}</b>
              </div>

              <div>
                Totale: <b>{formatMoney(order.amount_total)}</b>
              </div>

              {/* ITEMS */}
              <div style={{ marginTop: 10 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ fontSize: 14 }}>
                    {item.productName} ({item.variantName}) x {item.qty}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}