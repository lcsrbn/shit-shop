import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

const ADMIN_COOKIE = "shit_shop_admin_session";

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

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeItemsJson(value: unknown): OrderItemRow[] {
  const mapItem = (item: unknown): OrderItemRow | null => {
    if (!item || typeof item !== "object") return null;

    const row = item as Record<string, unknown>;

    const qty = toNumber(row.qty ?? row.quantity, 1);
    const unitPriceEUR = toNumber(
      row.unitPriceEUR ?? row.unit_price_eur ?? row.price,
      0
    );

    return {
      productName: String(
        row.name ?? row.productName ?? row.product_name ?? row.title ?? "Prodotto"
      ),
      variantName: String(
        row.variant ?? row.variantName ?? row.variant_name ?? "Default"
      ),
      qty,
      unitPriceEUR,
      lineTotalEUR: toNumber(
        row.lineTotalEUR ?? row.line_total_eur,
        qty * unitPriceEUR
      ),
    };
  };

  if (Array.isArray(value)) {
    return value
      .map(mapItem)
      .filter((item): item is OrderItemRow => item !== null);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map(mapItem)
          .filter((item): item is OrderItemRow => item !== null);
      }

      if (parsed && typeof parsed === "object") {
        const single = mapItem(parsed);
        return single ? [single] : [];
      }

      return [];
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

function formatMoneyCents(value: number | null, currency: string | null = "EUR") {
  if (value == null) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value / 100);
}

function formatMoneyNumber(value: number | null, currency: string | null = "EUR") {
  if (value == null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return value;
  }
}

async function getOrders() {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin orders query error:", error);
    return {
      adminLabel: "Admin session",
      orders: [] as OrderRow[],
    };
  }

  return {
    adminLabel: "Admin session",
    orders: (data as OrderRow[]) ?? [],
  };
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const statusFilter = resolvedSearchParams.status ?? "all";
  const query = (resolvedSearchParams.q ?? "").trim().toLowerCase();

  const { adminLabel, orders } = await getOrders();

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" ||
      (order.status ?? "").toLowerCase() === statusFilter.toLowerCase();

    const searchable = [
      order.order_id ?? "",
      order.id ?? "",
      order.customer_email ?? "",
      order.customer_name ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);

    return matchesStatus && matchesQuery;
  });

  return (
    <main style={{ padding: 30, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop admin</div>

          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 34,
              fontWeight: 950,
              letterSpacing: "-0.03em",
            }}
          >
            Admin Orders
          </h1>

          <p style={{ marginTop: 10, opacity: 0.75 }}>
            Loggato come: {adminLabel}
          </p>
        </div>

        <form action="/api/admin-auth/logout" method="post">
          <button
            type="submit"
            style={{
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,.12)",
              background: "#fff",
              padding: "10px 14px",
              color: "#111",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Logout admin
          </button>
        </form>
      </div>

      <form
        method="GET"
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          name="q"
          defaultValue={resolvedSearchParams.q ?? ""}
          placeholder="Cerca email, nome, order id..."
          style={{
            flex: "1 1 280px",
            minWidth: 240,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,.14)",
            background: "#fff",
          }}
        />

        <select
          name="status"
          defaultValue={statusFilter}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,.14)",
            background: "#fff",
          }}
        >
          <option value="all">Tutti gli stati</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="shipped">Shipped</option>
        </select>

        <button
          type="submit"
          style={{
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "10px 14px",
            color: "#111",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Filtra
        </button>
      </form>

      <div style={{ marginTop: 12, opacity: 0.75, fontSize: 14 }}>
        Ordini trovati: <b>{filteredOrders.length}</b>
      </div>

      <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
        {filteredOrders.length === 0 ? (
          <section
            style={{
              border: "1px solid rgba(0,0,0,.10)",
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,.92)",
            }}
          >
            <p style={{ margin: 0, opacity: 0.8 }}>
              Nessun ordine trovato con i filtri correnti.
            </p>
          </section>
        ) : (
          filteredOrders.map((order) => {
            const items = normalizeItemsJson(order.items_json);

            return (
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
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Ordine</div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>
                      {order.order_id ?? order.id}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                      DB id: {order.id}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                      User id: {order.user_id ?? "—"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Creato il</div>
                    <div style={{ fontWeight: 900 }}>
                      {formatDate(order.created_at)}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      Stato attuale: <b>{order.status ?? "—"}</b>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                      <OrderStatusSelect
                        orderId={order.id}
                        initialStatus={order.status}
                      />
                    </div>

                    <div style={{ marginTop: 8 }}>
                      Totale:{" "}
                      <b>{formatMoneyCents(order.amount_total, order.currency)}</b>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Cliente</div>
                    <div style={{ fontWeight: 800 }}>
                      {order.customer_name ?? "—"}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      {order.customer_email ?? "—"}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      {order.customer_phone ?? "—"}
                    </div>
                    <div style={{ marginTop: 8, opacity: 0.8 }}>
                      Cod. fiscale: {order.tax_code ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Spedizione</div>
                    <div>{order.shipping_line1 ?? "—"}</div>
                    {order.shipping_line2 ? <div>{order.shipping_line2}</div> : null}
                    <div>
                      {[order.shipping_postal_code, order.shipping_city]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    <div>
                      {[order.shipping_state, order.shipping_country]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, opacity: 0.65 }}>Note ordine</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {order.order_note ?? "—"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.65,
                      marginBottom: 10,
                    }}
                  >
                    Line items
                  </div>

                  {items.length === 0 ? (
                    <div
                      style={{
                        border: "1px dashed rgba(0,0,0,.12)",
                        borderRadius: 14,
                        padding: 14,
                        opacity: 0.8,
                      }}
                    >
                      Nessun line item disponibile.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {items.map((item, index) => (
                        <div
                          key={`${order.id}-${index}`}
                          style={{
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 14,
                            padding: 12,
                            background: "rgba(0,0,0,.02)",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{item.productName}</div>
                          <div style={{ marginTop: 4, opacity: 0.8 }}>
                            Variante: {item.variantName}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            Qty: <b>{item.qty}</b>
                          </div>
                          <div>
                            Prezzo unitario:{" "}
                            <b>{formatMoneyNumber(item.unitPriceEUR, order.currency)}</b>
                          </div>
                          <div>
                            Totale riga:{" "}
                            <b>{formatMoneyNumber(item.lineTotalEUR, order.currency)}</b>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}