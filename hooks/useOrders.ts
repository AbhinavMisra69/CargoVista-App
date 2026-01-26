"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { CreateOrderInput, Order, OrderType } from "@/types/db";

export function useOrders(type: OrderType, sellerId?: number) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(() => sellerId != null && !Number.isNaN(sellerId), [sellerId]);

  const refresh = useCallback(async () => {
    if (!canFetch) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.listOrders(type, sellerId);
      setOrders(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [canFetch, sellerId, type]);

  const create = useCallback(
    async (input: CreateOrderInput) => {
      const created = await api.createOrder(type, input);
      setOrders((prev) => [created, ...prev]);
      return created;
    },
    [type]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { orders, loading, error, refresh, create };
}

