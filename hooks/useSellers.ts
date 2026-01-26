"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import type { CreateSellerInput, Seller } from "@/types/db";

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSellers();
      setSellers(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e) ?? "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (input: CreateSellerInput) => {
    const created = await api.createSeller(input);
    // Optimistically prepend (API sorts desc by createdAt)
    setSellers((prev) => [created, ...prev]);
    return created;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { sellers, loading, error, refresh, create };
}

