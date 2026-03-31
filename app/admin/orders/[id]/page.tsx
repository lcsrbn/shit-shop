import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { normalizeItemsJson } from "@/lib/order";

const ADMIN_COOKIE = "shit_shop_admin_session";

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
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatMoneyCents(value: number | null, currency: string | null = "EUR") {
  if (value == null) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value / 100);
}

function formatMoneyNumber(
  value: number | null,
  currency: string | null = "EUR"
) {
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

async function getOrder(id: string): Promise<OrderRow> {
  const cookieStore = await cookies();
  const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

  if (!hasAdminSession) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  return data as OrderRow;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrder(id);
  const items = normalizeItemsJson(order.items_json);

  return (
    <main
      style={{
        maxWidth: 980,
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
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
            shit-shop admin
          </div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Dettaglio ordine</h1>
          <p style={{ marginTop: 10, opacity: 0.8 }}>
            Ordine: {order.order_id ?? order.id}
          </p>
          <p style={{ marginTop: 6, opacity: 0.65 }}>DB id: {order.id}</p>
          <p style={{ marginTop: 6, opacity: 0.65 }}>
            User id: {order.user_id ?? "—"}
          </p>
        </div>

        <Link
          href="/admin/orders"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,.14)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          ← Torna alla lista
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
          <h2 style={{ marginTop: 0 }}>Cliente</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>{order.customer_name ?? "—"}</div>
            <div>{order.customer_email ?? "—"}</div>
            <div>{order.customer_phone ?? "—"}</div>
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
          <h2 style={{ marginTop: 0 }}>Ordine</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div>Creato il: {formatDate(order.created_at)}</div>
            <div>Stato attuale: {order.status ?? "—"}</div>

            <div style={{ maxWidth: 240 }}>
              <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
            </div>

            <div>
              Subtotale: {formatMoneyCents(order.amount_subtotal, order.currency)}
            </div>
            <div>Totale: {formatMoneyCents(order.amount_total, order.currency)}</div>
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

        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Stripe</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>Session: {order.stripe_session_id ?? "—"}</div>
            <div>Payment intent: {order.stripe_payment_intent_id ?? "—"}</div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(0,0,0,.1)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Line items</h2>

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
                    <div>Qty: {item.qty}</div>
                    <div>
                      Prezzo unitario:{" "}
                      {formatMoneyNumber(item.unitPriceEUR, order.currency)}
                    </div>
                    <div>
                      Totale riga:{" "}
                      {formatMoneyNumber(item.lineTotalEUR, order.currency)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}