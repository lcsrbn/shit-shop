import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

type OrderItemRow = {
  productName: string;
  variantName: string;
  qty: number;
  unitPriceEUR: number;
  lineTotalEUR: number;
};

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeItemsJson(value: unknown): OrderItemRow[] {
  const mapItem = (item: unknown): OrderItemRow | null => {
    if (!item || typeof item !== "object") return null;

    const row = item as Record<string, unknown>;

    const qty = toNumber(row.qty ?? row.quantity, 1);
    const unitPriceEUR = toNumber(
      row.unitPriceEUR ?? row.unit_price_eur ?? row.price,
      0
    );

    return {
      productName: String(
        row.name ?? row.productName ?? row.product_name ?? row.title ?? "Prodotto"
      ),
      variantName: String(
        row.variant ?? row.variantName ?? row.variant_name ?? "Default"
      ),
      qty,
      unitPriceEUR,
      lineTotalEUR: toNumber(
        row.lineTotalEUR ?? row.line_total_eur,
        qty * unitPriceEUR
      ),
    };
  };

  if (Array.isArray(value)) {
    return value
      .map(mapItem)
      .filter((item): item is OrderItemRow => item !== null);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map(mapItem)
          .filter((item): item is OrderItemRow => item !== null);
      }

      if (parsed && typeof parsed === "object") {
        const single = mapItem(parsed);
        return single ? [single] : [];
      }

      return [];
    } catch {
      return [];
    }
  }

  if (value && typeof value === "object") {
    const single = mapItem(value);
    return single ? [single] : [];
  }

  return [];
}

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
    <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
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
            Dettaglio ordine
          </h1>

          <div style={{ marginTop: 10, opacity: 0.8 }}>
            <div>
              Ordine: <b>{order.order_id ?? order.id}</b>
            </div>
            <div>DB id: {order.id}</div>
            <div>User id: {order.user_id ?? "—"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/admin/orders"
            style={{
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,.12)",
              background: "#fff",
              padding: "10px 14px",
              color: "#111",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← Torna alla lista
          </Link>
        </div>
      </div>

      <section
        style={{
          marginTop: 24,
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,.92)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>Cliente</div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>
              {order.customer_name ?? "—"}
            </div>
            <div style={{ marginTop: 4 }}>{order.customer_email ?? "—"}</div>
            <div>{order.customer_phone ?? "—"}</div>

            <div style={{ marginTop: 12 }}>
              Cod. fiscale: <b>{order.tax_code ?? "—"}</b>
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
              Creato il: <b>{formatDate(order.created_at)}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              Stato attuale: <b>{order.status ?? "—"}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              <OrderStatusSelect
                orderId={order.id}
                initialStatus={order.status}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              Subtotale:{" "}
              <b>{formatMoneyCents(order.amount_subtotal, order.currency)}</b>
            </div>
            <div>
              Totale: <b>{formatMoneyCents(order.amount_total, order.currency)}</b>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>Note ordine</div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {order.order_note ?? "—"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>Stripe</div>
            <div style={{ wordBreak: "break-all" }}>
              Session: {order.stripe_session_id ?? "—"}
            </div>
            <div style={{ marginTop: 8, wordBreak: "break-all" }}>
              Payment intent: {order.stripe_payment_intent_id ?? "—"}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          marginTop: 18,
          border: "1px solid rgba(0,0,0,.10)",
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,.92)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            opacity: 0.65,
            marginBottom: 12,
          }}
        >
          Line items
        </div>

        {items.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(0,0,0,.12)",
              borderRadius: 14,
              padding: 14,
              opacity: 0.8,
            }}
          >
            Nessun line item disponibile.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item, index) => (
              <div
                key={`${order.id}-${index}`}
                style={{
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(0,0,0,.02)",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {item.productName}
                </div>
                <div style={{ marginTop: 4, opacity: 0.8 }}>
                  Variante: {item.variantName}
                </div>
                <div style={{ marginTop: 10 }}>
                  Qty: <b>{item.qty}</b>
                </div>
                <div>
                  Prezzo unitario:{" "}
                  <b>{formatMoneyNumber(item.unitPriceEUR, order.currency)}</b>
                </div>
                <div>
                  Totale riga:{" "}
                  <b>{formatMoneyNumber(item.lineTotalEUR, order.currency)}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}