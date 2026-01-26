import type { CreateOrderInput, CreateSellerInput, Order, OrderType, Seller } from "@/types/db";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  console.log(`[API] Fetching: ${path}`, { method: init?.method || 'GET', body: init?.body });
  
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  console.log(`[API] Response status: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    let details: unknown = undefined;
    try {
      const text = await res.text();
      console.error(`[API] Error response body:`, text);
      details = JSON.parse(text);
    } catch {
      // ignore
    }
    const message = (() => {
      if (isRecord(details)) {
        const err = details.error;
        const msg = details.message;
        if (typeof err === "string") return err;
        if (typeof msg === "string") return msg;
      }
      return `Request failed: ${res.status} ${res.statusText}`;
    })();
    console.error(`[API] Error:`, message);
    throw new Error(message);
  }

  const data = await res.json() as T;
  console.log(`[API] Success:`, data);
  return data;
}

export const api = {
  // Sellers
  listSellers: () => apiFetch<Seller[]>("/api/sellers"),
  createSeller: (input: CreateSellerInput) =>
    apiFetch<Seller>("/api/sellers", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Orders by type
  listOrders: (type: OrderType, sellerId?: number) => {
    const qs = sellerId != null ? `?sellerId=${encodeURIComponent(String(sellerId))}` : "";
    return apiFetch<Order[]>(`/api/orders/${type}${qs}`);
  },
  createOrder: (type: OrderType, input: CreateOrderInput) =>
    apiFetch<Order>(`/api/orders/${type}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

