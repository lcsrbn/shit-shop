import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const ADMIN_COOKIE = "shit_shop_admin_session";

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

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  order_id: string | null;
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
  user_id: string | null;
  items_json: OrderItemRow[] | null;
};

function formatMoney(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  const value = cents / 100;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value);
}

function formatEUR(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return value;
  }
}

export default async function AdminOrdersPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(ADMIN_COOKIE)?.value;

  if (adminSession !== "1") {
    redirect("/admin/login");
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop admin</div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 34,
            fontWeight: 950,
            letterSpacing: "-0.03em",
          }}
        >
          Admin · Ordini
        </h1>
        <p style={{ marginTop: 18, color: "crimson" }}>
          Errore caricamento ordini: {error.message}
        </p>
      </main>
    );
  }

  const orders = (data as OrderRow[]) ?? [];

  return (
    <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
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
            Admin · Ordini
          </h1>
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

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Vista completa di tutti gli ordini salvati nel database.
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {orders.length === 0 ? (
          <section
            style={{
              border: "1px solid rgba(0,0,0,.10)",
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,.92)",
            }}
          >
            Nessun ordine trovato.
          </section>
        ) : (
          orders.map((order) => (
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
                }}
              >
                <div>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Ordine</div>
                  <div style={{ fontWeight: 950 }}>
                    {order.order_id ?? order.id}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>
                    user_id: {order.user_id ?? "—"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Creato il</div>
                  <div style={{ fontWeight: 900 }}>
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
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
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Ordine</div>
                  <div>
                    Stato: <b>{order.status}</b>
                  </div>
                  <div>
                    Totale: <b>{formatMoney(order.amount_total, order.currency)}</b>
                  </div>
                  <div>Cod. fiscale: {order.tax_code ?? "—"}</div>
                  <div>Note: {order.order_note ?? "—"}</div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 10 }}>
                  Articoli acquistati
                </div>

                {!order.items_json || order.items_json.length === 0 ? (
                  <div style={{ opacity: 0.7 }}>Nessun line item disponibile.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {order.items_json.map((item, index) => (
                      <div
                        key={`${order.id}-${item.variantId}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr auto auto",
                          gap: 12,
                          alignItems: "center",
                          padding: "10px 12px",
                          border: "1px solid rgba(0,0,0,.08)",
                          borderRadius: 12,
                          background: "#fff",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>{item.productName}</div>
                          <div style={{ fontSize: 13, opacity: 0.75 }}>
                            Variante: {item.variantName}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.6 }}>
                            SKU: {item.sku}
                          </div>
                        </div>

                        <div style={{ fontSize: 14 }}>
                          {formatEUR(item.unitPriceEUR)} cad.
                        </div>

                        <div style={{ fontWeight: 800 }}>Qty {item.qty}</div>

                        <div style={{ fontWeight: 900 }}>
                          {formatEUR(item.lineTotalEUR)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}