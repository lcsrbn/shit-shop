import Link from "next/link";
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
  amount_total: number | null;
  currency: string | null;
};

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

function formatMoneyCents(
  value: number | null,
  currency: string | null = "EUR"
) {
  if (value == null) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return value;
  }
}

async function getAdminData() {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseAdminClient();

  const [
    { data: ordersData, error: ordersError },
    { data: settingsData, error: settingsError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, created_at, status, order_id, user_id, customer_email, customer_name, amount_total, currency"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single(),
  ]);

  if (ordersError) {
    console.error("Admin orders query error:", ordersError);
  }

  if (settingsError) {
    console.error("Admin settings query error:", settingsError);
  }

  return {
    adminLabel: "Admin session",
    orders: (ordersData as OrderRow[]) ?? [],
    maintenanceMode: settingsData?.value === true,
  };
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const statusFilter = resolvedSearchParams.status ?? "all";
  const query = (resolvedSearchParams.q ?? "").trim().toLowerCase();

  const { adminLabel, orders, maintenanceMode } = await getAdminData();

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

          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Maintenance: <b>{maintenanceMode ? "ON" : "OFF"}</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <form action="/api/admin/settings/toggle-maintenance" method="post">
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
              {maintenanceMode ? "Disattiva maintenance" : "Attiva maintenance"}
            </button>
          </form>

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

      <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
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
          filteredOrders.map((order) => (
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
                  display: "grid",
                  gridTemplateColumns: "minmax(260px, 1.4fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr) auto",
                  gap: 16,
                  alignItems: "start",
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
                  <div style={{ marginTop: 10, fontWeight: 800 }}>
                    {order.customer_name ?? "—"}
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    {order.customer_email ?? "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Creato il</div>
                  <div style={{ fontWeight: 900 }}>
                    {formatDate(order.created_at)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Stato</div>
                  <div style={{ marginBottom: 8 }}>
                    <b>{order.status ?? "—"}</b>
                  </div>
                  <OrderStatusSelect
                    orderId={order.id}
                    initialStatus={order.status}
                  />
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>Totale</div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {formatMoneyCents(order.amount_total, order.currency)}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      style={{
                        display: "inline-block",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,.12)",
                        background: "#fff",
                        padding: "10px 14px",
                        color: "#111",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      Apri dettaglio
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}