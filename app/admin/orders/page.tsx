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
  amount_subtotal: number | null;
  amount_total: number | null;
  items_json: unknown;
};

type OrderItemRow = {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  qty: number;
  unitPriceEUR: number;
  lineTotalEUR: number;
};

function formatMoney(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  const value = cents / 100;

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value);
}

function formatMoneyFromNumber(value: number | null, currency: string | null) {
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

function toFiniteNumber(value: unknown, fallback = 0): number {
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

    const qty = toFiniteNumber(row.qty ?? row.quantity, 1);
    const unitPrice =
      toFiniteNumber(
        row.unitPriceEUR ??
          row.unit_price_eur ??
          row.unit_price ??
          row.price ??
          row.price_eur,
        0
      );

    const computedLineTotal = qty * unitPrice;

    const lineTotal =
      toFiniteNumber(
        row.lineTotalEUR ??
          row.line_total_eur ??
          row.line_total ??
          row.total,
        computedLineTotal
      );

    return {
      productId: String(row.productId ?? row.product_id ?? ""),
      productName: String(
        row.productName ??
          row.product_name ??
          row.name ??
          row.title ??
          "Prodotto"
      ),
      variantId: String(row.variantId ?? row.variant_id ?? ""),
      variantName: String(
        row.variantName ??
          row.variant_name ??
          row.variant ??
          row.option_name ??
          "Default"
      ),
      sku: String(row.sku ?? ""),
      qty,
      unitPriceEUR: unitPrice,
      lineTotalEUR: lineTotal,
    };
  };

  const normalizeArray = (arr: unknown[]): OrderItemRow[] =>
    arr
      .map(mapItem)
      .filter((item): item is OrderItemRow => item !== null);

  if (Array.isArray(value)) {
    return normalizeArray(value);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeArray(parsed);
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

async function getAdminOrders(): Promise<{
  userEmail: string | null;
  orders: OrderRow[];
}> {
  const supabase = await getSupabaseServerAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const currentEmail = (user.email ?? "").toLowerCase();
    if (!adminEmails.includes(currentEmail)) {
      redirect("/");
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin orders query error:", error);
    return {
      userEmail: user.email ?? null,
      orders: [],
    };
  }

  return {
    userEmail: user.email ?? null,
    orders: (data as OrderRow[]) ?? [],
  };
}

export default async function AdminOrdersPage() {
  const { userEmail, orders } = await getAdminOrders();

  return (
    <main style={{ padding: 30, maxWidth: 1200, margin: "0 auto" }}>
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
        Loggato come: {userEmail ?? "admin"}
      </p>

      <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
        {orders.length === 0 ? (
          <section
            style={{
              border: "1px solid rgba(0,0,0,.10)",
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,.92)",
            }}
          >
            <p style={{ margin: 0, opacity: 0.8 }}>Nessun ordine trovato.</p>
          </section>
        ) : (
          orders.map((order) => {
            const orderItems = normalizeItemsJson(order.items_json);

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
                      Stato: <b>{order.status ?? "—"}</b>
                    </div>
                    <div>
                      Totale:{" "}
                      <b>{formatMoney(order.amount_total, order.currency)}</b>
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

                  {orderItems.length === 0 ? (
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
                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      {orderItems.map((item, index) => (
                        <div
                          key={`${order.id}-${item.variantId || item.productId || index}`}
                          style={{
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 14,
                            padding: 12,
                            background: "rgba(0,0,0,.02)",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>
                            {item.productName}
                          </div>

                          <div style={{ marginTop: 4, opacity: 0.8 }}>
                            Variante: {item.variantName || "Default"}
                          </div>

                          <div style={{ marginTop: 4, opacity: 0.8 }}>
                            SKU: {item.sku || "—"}
                          </div>

                          <div style={{ marginTop: 8 }}>
                            Qty: <b>{item.qty}</b>
                          </div>

                          <div>
                            Prezzo unitario:{" "}
                            <b>
                              {formatMoneyFromNumber(
                                item.unitPriceEUR,
                                order.currency ?? "EUR"
                              )}
                            </b>
                          </div>

                          <div>
                            Totale riga:{" "}
                            <b>
                              {formatMoneyFromNumber(
                                item.lineTotalEUR,
                                order.currency ?? "EUR"
                              )}
                            </b>
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