import Link from "next/link";

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
};

async function getOrders(): Promise<OrderRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) return [];

  const res = await fetch(`${baseUrl}/api/orders`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as { orders?: OrderRow[] };
  return json.orders ?? [];
}

function formatMoney(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  const value = cents / 100;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value);
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return value;
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <main style={{ padding: 30, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop</div>
      <h1
        style={{
          margin: "6px 0 0",
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: "-0.03em",
        }}
      >
        Ordini
      </h1>

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Elenco ordini salvati nel database.
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
            <p style={{ margin: 0, opacity: 0.8 }}>Nessun ordine trovato.</p>

            <div style={{ marginTop: 16 }}>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,.12)",
                  background: "#fff",
                  padding: "12px 16px",
                  textDecoration: "none",
                  color: "#111",
                  fontWeight: 800,
                }}
              >
                Torna allo shop
              </Link>
            </div>
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
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Creato il</div>
                  <div style={{ fontWeight: 900 }}>{formatDate(order.created_at)}</div>
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
                  <div style={{ fontWeight: 800 }}>{order.customer_name ?? "—"}</div>
                  <div style={{ opacity: 0.8 }}>{order.customer_email ?? "—"}</div>
                  <div style={{ opacity: 0.8 }}>{order.customer_phone ?? "—"}</div>
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
                  <div>Stato: <b>{order.status}</b></div>
                  <div>Totale: <b>{formatMoney(order.amount_total, order.currency)}</b></div>
                  <div>Cod. fiscale: {order.tax_code ?? "—"}</div>
                  <div>Note: {order.order_note ?? "—"}</div>
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}