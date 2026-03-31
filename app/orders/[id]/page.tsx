import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";
import {
  formatCents,
  formatEUR,
  getOrderStatusLabel,
  normalizeItemsJson,
  validateOrderAmounts,
} from "@/lib/order";

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

type CustomerOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return value;
  }
}

async function getOrderForCurrentUser(id: string): Promise<OrderRow> {
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
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return data as OrderRow;
}

export default async function CustomerOrderDetailPage({
  params,
}: CustomerOrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderForCurrentUser(id);
  const items = normalizeItemsJson(order.items_json);

  validateOrderAmounts(items, order.amount_total);

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px 64px",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
          shit-shop
        </div>
        <h1 style={{ margin: 0, fontSize: 32 }}>Dettaglio ordine</h1>
        <p style={{ marginTop: 10, opacity: 0.8 }}>
          Ordine: {order.order_id ?? order.id}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Link
          href="/orders"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,.14)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          ← Torna ai tuoi ordini
        </Link>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Ordine</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>Creato il: {formatDate(order.created_at)}</div>
            <div>Stato attuale: {getOrderStatusLabel(order.status)}</div>
            <div>Subtotale: {formatCents(order.amount_subtotal, order.currency)}</div>
            <div>Totale: {formatCents(order.amount_total, order.currency)}</div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Prodotti acquistati</h2>

          {items.length === 0 ? (
            <p style={{ marginBottom: 0 }}>Nessun line item disponibile.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {items.map((item, index) => (
                <article
                  key={`${item.productName}-${item.variantName}-${index}`}
                  style={{
                    border: "1px solid rgba(0,0,0,.08)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    {item.productName}
                  </div>
                  <div style={{ display: "grid", gap: 6, opacity: 0.9 }}>
                    <div>Variante: {item.variantName}</div>
                    <div>Quantità: {item.qty}</div>
                    <div>
                      Prezzo unitario: {formatEUR(item.unitPriceEUR, order.currency)}
                    </div>
                    <div>
                      Totale riga: {formatEUR(item.lineTotalEUR, order.currency)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Informazioni cliente</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>Nome: {order.customer_name ?? "—"}</div>
            <div>Email: {order.customer_email ?? "—"}</div>
            <div>Telefono: {order.customer_phone ?? "—"}</div>
            <div>Cod. fiscale: {order.tax_code ?? "—"}</div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Spedizione</h2>
          <div style={{ display: "grid", gap: 8 }}>
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
        </section>

        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Note ordine</h2>
          <p style={{ marginBottom: 0 }}>{order.order_note ?? "—"}</p>
        </section>
      </div>
    </main>
  );
}