import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const ADMIN_COOKIE = "shit_shop_admin_session";

async function getDashboardData() {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseAdminClient();

  const [
    { count: newOrdersCount, error: ordersError },
    { data: settingsData, error: settingsError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single(),
  ]);

  if (ordersError) {
    console.error("Admin dashboard orders count error:", ordersError);
  }

  if (settingsError) {
    console.error("Admin dashboard settings query error:", settingsError);
  }

  return {
    newOrdersCount: newOrdersCount ?? 0,
    maintenanceMode: settingsData?.value === true,
  };
}

export default async function AdminDashboardPage() {
  const { newOrdersCount, maintenanceMode } = await getDashboardData();

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
            Dashboard
          </h1>

          <p style={{ marginTop: 10, opacity: 0.75 }}>
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
              {maintenanceMode ? "Turn maintenance off" : "Turn maintenance on"}
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

      <div
        style={{
          marginTop: 26,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <Link
          href="/admin/orders"
          style={{
            display: "block",
            border: "1px solid rgba(0,0,0,.10)",
            borderRadius: 18,
            padding: 24,
            background: "rgba(255,255,255,.92)",
            color: "#111",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 950 }}>Orders</div>

            {newOrdersCount > 0 && (
              <span
                style={{
                  borderRadius: 999,
                  background: "#111",
                  color: "#fff",
                  padding: "6px 14px",
                  fontWeight: 900,
                  fontSize: 15,
                }}
              >
                {newOrdersCount} new
              </span>
            )}
          </div>

          <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.75 }}>
            {newOrdersCount > 0
              ? `${newOrdersCount} paid ${
                  newOrdersCount === 1 ? "order" : "orders"
                } waiting to be shipped.`
              : "No orders waiting to be shipped."}
          </p>
        </Link>

        <Link
          href="/admin/products"
          style={{
            display: "block",
            border: "1px solid rgba(0,0,0,.10)",
            borderRadius: 18,
            padding: 24,
            background: "rgba(255,255,255,.92)",
            color: "#111",
            textDecoration: "none",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 950 }}>Products</div>

          <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.75 }}>
            Manage products, variants, stock, and media.
          </p>
        </Link>
      </div>
    </main>
  );
}
