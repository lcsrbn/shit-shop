import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminOrdersPage() {
  try {
    const supabase = getSupabaseServerClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return <div>Errore Supabase: {error.message}</div>;
    }

    return (
      <div style={{ padding: 20 }}>
        <h1>Admin Orders</h1>

        {orders?.length === 0 && <div>Nessun ordine</div>}

        {orders?.map((o) => (
          <div key={o.id} style={{ marginBottom: 20 }}>
            <pre>{JSON.stringify(o, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  } catch (err: any) {
    console.error("Admin crash:", err);
    return <div>CRASH: {err.message}</div>;
  }
}