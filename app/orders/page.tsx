import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";

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

async function getCurrentUserAndOrders(): Promise<{
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

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Orders page query error:", error);
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
  const { userEmail, orders } = await getCurrentUserAndOrders();

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
        I tuoi ordini
      </h1>

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Account: {userEmail ?? "utente loggato"}
      </p>

      <form action="/api/logout" method="post" style={{ marginTop: 12 }}>
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
          Logout
        </button>
      </form>

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
            <p style={{ margin: 0, opacity: 0.8 }}>
              Nessun ordine associato a questo account.
            </p>

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
            </section>
          ))
        )}
      </div>
    </main>
  );
}