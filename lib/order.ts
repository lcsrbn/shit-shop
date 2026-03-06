export type PendingOrder = {
    id: string;
    createdAt: number;
    items: { id: string; qty: number }[];
    subtotalEUR: number;
  };
  
  export type LocalOrder = PendingOrder & {
    savedAt: number;
    status: "paid";
  };
  
  const PENDING_KEY = "floating_shop_pending_order_v1";
  const ORDERS_KEY = "floating_shop_orders_v1";
  
  export function savePendingOrder(order: PendingOrder) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(order));
    } catch {}
  }
  
  export function readPendingOrder(): PendingOrder | null {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PendingOrder;
    } catch {
      return null;
    }
  }
  
  export function clearPendingOrder() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {}
  }
  
  export function readLocalOrders(): LocalOrder[] {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as LocalOrder[];
    } catch {
      return [];
    }
  }
  
  export function saveLocalOrder(order: PendingOrder) {
    try {
      const existing = readLocalOrders();
  
      // evita doppioni sullo stesso id
      if (existing.some((x) => x.id === order.id)) return;
  
      const next: LocalOrder[] = [
        {
          ...order,
          savedAt: Date.now(),
          status: "paid",
        },
        ...existing,
      ];
  
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {}
  }