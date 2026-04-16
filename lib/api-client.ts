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

// lib/api-client.ts

export const api = {
  createOrder: async (type: string, orderData: any) => {
    // Determine the 'type' string expected by the backend switch-case
    // Map your frontend types (e.g., 'cost_efficient') to DB models ('HubSpoke')
    let dbType = "HubSpoke"; // Default
    
    if (type === "speed") dbType = "P2P";
    if (type === "priority" || orderData.priority === 1) dbType = "Personalized";
    // Or if you pass 'HubSpoke' directly, use that.
    
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: dbType, // <--- CRITICAL: This tells the backend which table to use
        ...orderData
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create order");
    }

    return response.json();
  },
  listOrders: async (type: string, sellerId?: number) => {
    let dbType = "HubSpoke";

    if (type === "speed") dbType = "P2P";
    if (type === "priority") dbType = "Personalized";

    const query = new URLSearchParams({
      type: dbType,
      ...(sellerId !== undefined ? { sellerId: String(sellerId) } : {}),
    });

    const res = await fetch(`/api/orders?${query.toString()}`);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch orders");
    }

    return res.json();
  },
  createSeller: async (input: any) => {
    const res = await fetch("/api/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create seller");
    }
  
    return res.json();
  }
};



