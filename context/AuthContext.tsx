"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Seller } from "@/types/db";

type AuthContextType = {
  seller: Seller | null;
  loading: boolean;
  login: (sellerId: number, password?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const stored = localStorage.getItem("seller_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSeller(parsed);
      } catch {
        localStorage.removeItem("seller_session");
      }
    }
    setLoading(false);
  }, []);

  const login = async (sellerId: number, password?: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      const sellerData: Seller = await res.json();
      setSeller(sellerData);
      localStorage.setItem("seller_session", JSON.stringify(sellerData));
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setSeller(null);
    localStorage.removeItem("seller_session");
  };

  return (
    <AuthContext.Provider value={{ seller, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
