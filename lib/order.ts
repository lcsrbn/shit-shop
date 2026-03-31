export type PendingOrder = Record<string, unknown>;

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

export function savePendingOrder(order: PendingOrder) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
}

export function readPendingOrder(): PendingOrder | null {
  if (!isBrowser()) return null;
  return safeJsonParse<PendingOrder | null>(
    window.localStorage.getItem(PENDING_ORDER_KEY),
    null
  );
}

export function clearPendingOrder() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PENDING_ORDER_KEY);
}

export function saveLocalOrder(order: PendingOrder) {
  if (!isBrowser()) return;

  const orders = safeJsonParse<PendingOrder[]>(
    window.localStorage.getItem(LOCAL_ORDERS_KEY),
    []
  );

  orders.unshift(order);

  window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

export function readLocalOrders(): PendingOrder[] {
  if (!isBrowser()) return [];
  return safeJsonParse<PendingOrder[]>(
    window.localStorage.getItem(LOCAL_ORDERS_KEY),
    []
  );
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function normalizeItemsJson(value: unknown): OrderItemRow[] {
  const mapItem = (item: unknown): OrderItemRow | null => {
    if (!item || typeof item !== "object") {
      return null;
    }

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