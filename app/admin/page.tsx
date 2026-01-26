"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useSellers } from "@/hooks/useSellers";
import { useOrders } from "@/hooks/useOrders";
import type { OrderType } from "@/types/db";

function SafeContent({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  const SIDEBAR_WIDTH = "16rem";
  const ICON_BAR_WIDTH = "5rem";
  const currentMargin = isMobile ? "0px" : open ? SIDEBAR_WIDTH : ICON_BAR_WIDTH;

  return (
    <main
      className="flex-1 transition-all duration-300 ease-in-out h-screen overflow-auto bg-background"
      style={{ marginLeft: currentMargin, width: `calc(100% - ${currentMargin})` }}
    >
      {children}
    </main>
  );
}

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "hub-spoke", label: "Hub & Spoke" },
  { value: "p2p", label: "Point-to-Point" },
  { value: "personalized", label: "Personalized Carriers" },
];

export default function AdminPage() {
  const sellersHook = useSellers();

  const [sellerIdInput, setSellerIdInput] = useState("");
  const [sellerNameInput, setSellerNameInput] = useState("");
  const [sellerEmailInput, setSellerEmailInput] = useState("");
  const [sellerFormError, setSellerFormError] = useState<string | null>(null);

  const [selectedSellerIdStr, setSelectedSellerIdStr] = useState<string>("");
  const selectedSellerId = useMemo(() => {
    const n = Number(selectedSellerIdStr);
    return Number.isFinite(n) ? n : undefined;
  }, [selectedSellerIdStr]);

  useEffect(() => {
    if (!selectedSellerIdStr && sellersHook.sellers.length > 0) {
      setSelectedSellerIdStr(String(sellersHook.sellers[0].sellerId));
    }
  }, [selectedSellerIdStr, sellersHook.sellers]);

  const [orderType, setOrderType] = useState<OrderType>("hub-spoke");
  const ordersHook = useOrders(orderType, selectedSellerId);

  const [orderIdInput, setOrderIdInput] = useState("");
  const [sourceInput, setSourceInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [volumeInput, setVolumeInput] = useState("");
  const [priorityInput, setPriorityInput] = useState("3");
  const [orderFormError, setOrderFormError] = useState<string | null>(null);

  const selectedSeller = useMemo(
    () => sellersHook.sellers.find((s) => s.sellerId === selectedSellerId),
    [sellersHook.sellers, selectedSellerId]
  );

  async function handleCreateSeller(e: React.FormEvent) {
    e.preventDefault();
    setSellerFormError(null);

    const sellerId = Number(sellerIdInput);
    if (!Number.isFinite(sellerId)) {
      setSellerFormError("sellerId must be a number");
      return;
    }
    if (!sellerNameInput.trim()) {
      setSellerFormError("name is required");
      return;
    }

    try {
      const created = await sellersHook.create({
        sellerId,
        name: sellerNameInput.trim(),
        email: sellerEmailInput.trim() || undefined,
      });
      setSelectedSellerIdStr(String(created.sellerId));
      setSellerIdInput("");
      setSellerNameInput("");
      setSellerEmailInput("");
    } catch (err: any) {
      setSellerFormError(err?.message ?? "Failed to create seller");
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setOrderFormError(null);

    if (selectedSellerId == null) {
      setOrderFormError("Select a seller first");
      return;
    }

    const orderId = Number(orderIdInput);
    const source = Number(sourceInput);
    const destination = Number(destinationInput);
    const weight = Number(weightInput);
    const volume = Number(volumeInput);
    const priority = Number(priorityInput);

    const required = { orderId, source, destination, weight, volume };
    for (const [k, v] of Object.entries(required)) {
      if (!Number.isFinite(v)) {
        setOrderFormError(`${k} must be a number`);
        return;
      }
    }

    try {
      await ordersHook.create({
        orderId,
        sellerId: selectedSellerId,
        source,
        destination,
        weight,
        volume,
        priority: Number.isFinite(priority) ? priority : 3,
      });
      setOrderIdInput("");
      setSourceInput("");
      setDestinationInput("");
      setWeightInput("");
      setVolumeInput("");
      setPriorityInput("3");
    } catch (err: any) {
      setOrderFormError(err?.message ?? "Failed to create order");
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SafeContent>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white z-10 relative">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Operations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sellers</CardTitle>
                <CardDescription>Create and select a seller.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="space-y-2 flex-1">
                    <Label>Select seller</Label>
                    <Select
                      value={selectedSellerIdStr}
                      onValueChange={setSelectedSellerIdStr}
                      disabled={sellersHook.loading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            sellersHook.loading ? "Loading sellers..." : "Select seller"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sellersHook.sellers.map((s) => (
                          <SelectItem key={s._id} value={String(s.sellerId)}>
                            {s.name} (#{s.sellerId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void sellersHook.refresh()}
                  >
                    Refresh
                  </Button>
                </div>

                {sellersHook.error && (
                  <p className="text-sm text-red-600">Error: {sellersHook.error}</p>
                )}

                <Separator />

                <form onSubmit={handleCreateSeller} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>sellerId</Label>
                      <Input
                        value={sellerIdInput}
                        onChange={(e) => setSellerIdInput(e.target.value)}
                        placeholder="1"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Name</Label>
                      <Input
                        value={sellerNameInput}
                        onChange={(e) => setSellerNameInput(e.target.value)}
                        placeholder="Acme Logistics"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input
                      value={sellerEmailInput}
                      onChange={(e) => setSellerEmailInput(e.target.value)}
                      placeholder="acme@example.com"
                    />
                  </div>
                  {sellerFormError && (
                    <p className="text-sm text-red-600">{sellerFormError}</p>
                  )}
                  <Button type="submit">Create seller</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Create and view orders for the selected seller.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="space-y-2 flex-1">
                    <Label>Order model</Label>
                    <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void ordersHook.refresh()}
                    disabled={selectedSellerId == null}
                  >
                    Refresh
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Selected seller:{" "}
                  <span className="text-foreground font-medium">
                    {selectedSeller ? `${selectedSeller.name} (#${selectedSeller.sellerId})` : "—"}
                  </span>
                </div>

                {ordersHook.error && (
                  <p className="text-sm text-red-600">Error: {ordersHook.error}</p>
                )}

                <Separator />

                <form onSubmit={handleCreateOrder} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>orderId</Label>
                      <Input
                        value={orderIdInput}
                        onChange={(e) => setOrderIdInput(e.target.value)}
                        placeholder="1001"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>priority (default 3)</Label>
                      <Input
                        value={priorityInput}
                        onChange={(e) => setPriorityInput(e.target.value)}
                        placeholder="3"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>source</Label>
                      <Input
                        value={sourceInput}
                        onChange={(e) => setSourceInput(e.target.value)}
                        placeholder="10"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>destination</Label>
                      <Input
                        value={destinationInput}
                        onChange={(e) => setDestinationInput(e.target.value)}
                        placeholder="20"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>weight</Label>
                      <Input
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        placeholder="50"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>volume</Label>
                      <Input
                        value={volumeInput}
                        onChange={(e) => setVolumeInput(e.target.value)}
                        placeholder="3"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  {orderFormError && (
                    <p className="text-sm text-red-600">{orderFormError}</p>
                  )}

                  <Button type="submit" disabled={selectedSellerId == null}>
                    Create order
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order list</CardTitle>
              <CardDescription>
                {selectedSeller ? (
                  <>
                    Showing <span className="font-medium">{ORDER_TYPES.find((t) => t.value === orderType)?.label}</span>{" "}
                    orders for <span className="font-medium">{selectedSeller.name}</span>.
                  </>
                ) : (
                  "Select a seller to see orders."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersHook.loading ? (
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              ) : ordersHook.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders found.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">orderId</th>
                        <th className="py-2 pr-4">source</th>
                        <th className="py-2 pr-4">destination</th>
                        <th className="py-2 pr-4">weight</th>
                        <th className="py-2 pr-4">volume</th>
                        <th className="py-2 pr-4">priority</th>
                        <th className="py-2 pr-4">timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersHook.orders.map((o) => (
                        <tr key={o._id} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 font-medium">{o.orderId}</td>
                          <td className="py-2 pr-4">{o.source}</td>
                          <td className="py-2 pr-4">{o.destination}</td>
                          <td className="py-2 pr-4">{o.weight}</td>
                          <td className="py-2 pr-4">{o.volume}</td>
                          <td className="py-2 pr-4">{o.priority}</td>
                          <td className="py-2 pr-4">
                            {o.timestamp ? new Date(o.timestamp).toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SafeContent>
    </SidebarProvider>
  );
}

