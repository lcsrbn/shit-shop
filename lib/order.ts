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

function toPendingCartItems(value: unknown): PendingCartItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is PendingCartItem => {
    if (!item || typeof item !== "object") return false;

    const row = item as Record<string, unknown>;

    if (typeof row.qty !== "number") return false;

    if (typeof row.id === "string") {
      return true;
    }

    return (
      typeof row.productId === "string" && typeof row.variantId === "string"
    );
  });
}

function toLocalOrder(value: PendingOrder): LocalOrder {
  return {
    id: typeof value.id === "string" && value.id.length > 0
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
      typeof value.subtotalEUR === "number" && Number.isFinite(value.subtotalEUR)
        ? value.subtotalEUR
        : 0,
    items: toPendingCartItems(value.items),
  };
}

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

  if (!raw || typeof raw !== "object") {
    return null;
  }

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