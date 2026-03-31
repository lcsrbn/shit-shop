import type { CartItem } from "@/lib/cart";

type LegacyPendingCartItem = {
  id: string;
  qty: number;
};

export type PendingCartItem = LegacyPendingCartItem | CartItem;

export type PendingOrder = {
  id?: string;
  savedAt?: number;
  status?: string;
  subtotalEUR?: number;
  items?: PendingCartItem[];
  [key: string]: unknown;
};

export type LocalOrder = {
  id: string;
  savedAt: number;
  status: string;
  subtotalEUR: number;
  items: PendingCartItem[];
};

/**
 * 🔥 NUOVA SHAPE STABILE PER ORDINI (DB)
 */
export type OrderItem = {
  product_id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price_eur: number;
  line_total_eur: number;
};

export type OrderItemRow = {
  productName: string;
  variantName: string;
  qty: number;
  unitPriceEUR: number;
  lineTotalEUR: number;
};

const PENDING_ORDER_KEY = "shit_shop_pending_order";
const LOCAL_ORDERS_KEY = "shit_shop_orders";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * 🔒 NORMALIZZAZIONE STRONG DEL CARRELLO
 */
function toPendingCartItems(value: unknown): PendingCartItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is PendingCartItem => {
    if (!item || typeof item !== "object") return false;

    const row = item as Record<string, unknown>;

    if (typeof row.qty !== "number") return false;

    if (typeof row.id === "string") return true;

    return (
      typeof row.productId === "string" && typeof row.variantId === "string"
    );
  });
}

/**
 * 🔥 NORMALIZZAZIONE FORZATA PER STORAGE ORDINI LOCALI
 */
function toLocalOrder(value: PendingOrder): LocalOrder {
  return {
    id:
      typeof value.id === "string" && value.id.length > 0
        ? value.id
        : `local-${Date.now()}`,
    savedAt:
      typeof value.savedAt === "number" && Number.isFinite(value.savedAt)
        ? value.savedAt
        : Date.now(),
    status:
      typeof value.status === "string" && value.status.length > 0
        ? value.status
        : "paid",
    subtotalEUR:
      typeof value.subtotalEUR === "number" &&
      Number.isFinite(value.subtotalEUR)
        ? value.subtotalEUR
        : 0,
    items: toPendingCartItems(value.items),
  };
}

/**
 * 🧠 NORMALIZZAZIONE ITEMS DB → UI
 */
function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function mapOrderItem(item: unknown): OrderItemRow | null {
  if (!item || typeof item !== "object") return null;

  const row = item as Record<string, unknown>;

  // 🔥 nuova shape stabile
  if (
    typeof row.product_name === "string" &&
    typeof row.quantity !== "undefined"
  ) {
    const qty = toNumber(row.quantity, 1);
    const price = toNumber(row.unit_price_eur, 0);

    return {
      productName: row.product_name,
      variantName: String(row.variant_name ?? "Default"),
      qty,
      unitPriceEUR: price,
      lineTotalEUR: toNumber(row.line_total_eur, qty * price),
    };
  }

  // 🧯 fallback legacy (compatibilità)
  const qty = toNumber(row.qty ?? row.quantity, 1);
  const price = toNumber(
    row.unitPriceEUR ?? row.unit_price_eur ?? row.price,
    0
  );

  return {
    productName: String(
      row.name ?? row.productName ?? row.title ?? "Prodotto"
    ),
    variantName: String(
      row.variant ?? row.variantName ?? "Default"
    ),
    qty,
    unitPriceEUR: price,
    lineTotalEUR: toNumber(
      row.lineTotalEUR ?? row.line_total_eur,
      qty * price
    ),
  };
}

export function normalizeItemsJson(value: unknown): OrderItemRow[] {
  if (Array.isArray(value)) {
    return value
      .map(mapOrderItem)
      .filter((x): x is OrderItemRow => x !== null);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeItemsJson(parsed);
    } catch {
      return [];
    }
  }

  if (value && typeof value === "object") {
    const single = mapOrderItem(value);
    return single ? [single] : [];
  }

  return [];
}

/**
 * STORAGE FUNCTIONS (invariati ma tipizzati meglio)
 */
export function savePendingOrder(order: PendingOrder) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
}

export function readPendingOrder(): PendingOrder | null {
  if (!isBrowser()) return null;

  const raw = safeJsonParse<PendingOrder | null>(
    window.localStorage.getItem(PENDING_ORDER_KEY),
    null
  );

  if (!raw || typeof raw !== "object") return null;

  return {
    ...raw,
    items: toPendingCartItems(raw.items),
  };
}

export function clearPendingOrder() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PENDING_ORDER_KEY);
}

export function saveLocalOrder(order: PendingOrder) {
  if (!isBrowser()) return;

  const orders = safeJsonParse<LocalOrder[]>(
    window.localStorage.getItem(LOCAL_ORDERS_KEY),
    []
  );

  orders.unshift(toLocalOrder(order));

  window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

export function readLocalOrders(): LocalOrder[] {
  if (!isBrowser()) return [];

  const raw = safeJsonParse<unknown[]>(
    window.localStorage.getItem(LOCAL_ORDERS_KEY),
    []
  );

  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is PendingOrder => !!item && typeof item === "object")
    .map(toLocalOrder);
}

/**
 * 💰 IMPORTI — NORMALIZZAZIONE SICURA
 */

export function centsToEUR(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;

  return value / 100;
}

export function formatCents(
  value: number | null | undefined,
  currency: string | null = "EUR"
): string {
  if (value == null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value / 100);
}

export function formatEUR(
  value: number | null | undefined,
  currency: string | null = "EUR"
): string {
  if (value == null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value);
}

/**
 * 🔍 VALIDAZIONE (solo debug — non blocca)
 */
export function validateOrderAmounts(
  items: OrderItemRow[],
  amountTotalCents: number | null | undefined
) {
  if (!amountTotalCents || items.length === 0) return;

  const sum = items.reduce((acc, item) => {
    return acc + (item.lineTotalEUR ?? 0);
  }, 0);

  const totalEUR = amountTotalCents / 100;

  const diff = Math.abs(sum - totalEUR);

  if (diff > 0.01) {
    console.warn("⚠️ Order amount mismatch", {
      itemsSum: sum,
      totalEUR,
      diff,
    });
  }
}