import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = "luca.sorbini@gmail.com";

export default async function AdminOrdersPage() {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non loggato
  if (!user) {
    redirect("/login");
  }

  // Non admin
  if (user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900 }}>Admin · Ordini</h1>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {orders?.map((o) => (
          <section
            key={o.id}
            style={{
              border: "1px solid rgba(0,0,0,.1)",
              borderRadius: 16,
              padding: 16,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 900 }}>
              {o.order_id ?? o.id}
            </div>

            <div style={{ opacity: 0.7 }}>
              {o.customer_email}
            </div>

            <div>
              Totale: <b>{(o.amount_total / 100).toFixed(2)} €</b>
            </div>

            <div>Stato: {o.status}</div>
          </section>
        ))}
      </div>
    </main>
  );
}