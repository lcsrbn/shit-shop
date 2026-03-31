import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  order_id: string | null;
  currency: string | null;
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
    .select("id, created_at, status, order_id, currency, amount_total")
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

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(cents / 100);
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
    <main
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "40px 20px 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
            shit-shop
          </div>
          <h1 style={{ margin: 0, fontSize: 32 }}>I tuoi ordini</h1>
          <p style={{ marginTop: 10, opacity: 0.8 }}>
            Account: {userEmail ?? "utente loggato"}
          </p>
        </div>

        <form action="/api/logout" method="post">
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,.14)",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <p style={{ marginTop: 0 }}>Nessun ordine associato a questo account.</p>

          <Link href="/" style={{ textDecoration: "underline" }}>
            Torna allo shop
          </Link>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {orders.map((order) => (
            <article
              key={order.id}
              style={{
                border: "1px solid rgba(0,0,0,.1)",
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 6 }}>
                    Ordine
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {order.order_id ?? order.id}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 6 }}>
                    Totale
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {formatMoney(order.amount_total, order.currency)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  marginBottom: 14,
                  opacity: 0.85,
                }}
              >
                <div>Creato il: {formatDate(order.created_at)}</div>
                <div>Stato: {order.status ?? "—"}</div>
              </div>

              <Link
                href={`/orders/${order.id}`}
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,.14)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                Apri dettaglio
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}