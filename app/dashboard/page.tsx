"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, useSidebar, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Import your MultiForm (ensure path is correct)
import { MultiForm, MultiFormSchema } from "@/components/multiform";
import { mapFormToOrders, getOrderTypeForForm } from "@/lib/order-mapper";
import { api } from "@/lib/api-client";

// Types import
import { City, RouteData } from "@/components/MapDisplay"



const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full bg-slate-900 animate-pulse rounded-xl flex items-center justify-center text-slate-500">
      Loading Route Visualization...
    </div>
  )
});

// --- DATA ---
const NORTH_INDIA_CITIES: City[] = [
  { name: "Delhi", coords: [28.6139, 77.2090] },
  { name: "Jaipur", coords: [26.9124, 75.7873] },
  { name: "Lucknow", coords: [26.8467, 80.9462] },
  { name: "Chandigarh", coords: [30.7333, 76.7794] },
  { name: "Agra", coords: [27.1767, 78.0081] },
  { name: "Ambala", coords: [30.3782, 76.7767] },
  { name: "Kanpur", coords: [26.4499, 80.3319] },
  // ... (You can keep your full list here, heavily abbreviated for brevity)
]

function LayoutTextFlipDemo() {
  return (
    <div >
      <motion.div className="relative mx-4 my-4 flex flex-col items-center justify-center gap-4 text-center sm:mx-0 sm:mb-0 sm:flex-row">
        <LayoutTextFlip
          text="Operations Dashboard: "
          words={["Logistics", "Planning", "Routing", "Analytics"]}
        />
      </motion.div>
    </div>
  );
}

function SafeContent({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar()
  const SIDEBAR_WIDTH = "16rem"
  const ICON_BAR_WIDTH = "5rem"
  const currentMargin = isMobile ? "0px" : open ? SIDEBAR_WIDTH : ICON_BAR_WIDTH

  return (
    <main
      className="flex-1 transition-all duration-300 ease-in-out h-screen overflow-auto bg-slate-50 dark:bg-slate-950"
      style={{ marginLeft: currentMargin, width: `calc(100% - ${currentMargin})` }}
    >
      {children}
    </main>
  )
}

const cityOptions = NORTH_INDIA_CITIES.map(c => c.name).sort();

export default function Page() {
  const { seller, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState<RouteData | null>(null)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [solverResults, setSolverResults] = useState<any[]>([])
  const [showSolverResults, setShowSolverResults] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !seller) {
      router.push("/login");
    }
  }, [seller, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!seller) {
    return null;
  }

  // --- LOGIC: HANDLE FORM SUBMISSION ---
  const handleFormSubmit = async (data: MultiFormSchema) => {
    console.log("=== HANDLE FORM SUBMIT CALLED ===");
    console.log("Form submitted with data:", JSON.stringify(data, null, 2));
    
    if (!seller) {
      console.error("No seller found");
      toast.error("You must be logged in to submit orders");
      return;
    }

    console.log("Seller found:", seller);
    setSubmitting(true);
    toast.info("Starting order submission...");

    try {
      // 1. Map form data to order inputs
      console.log("Step 1: Mapping form data to orders...");
      const orderInputs = mapFormToOrders(data, seller.sellerId);
      console.log("Mapped order inputs:", JSON.stringify(orderInputs, null, 2));
      
      if (orderInputs.length === 0) {
        console.error("No valid orders after mapping");
        toast.error("No valid orders to submit. Please ensure all orders have valid destinations.");
        setSubmitting(false);
        return;
      }

      // Validate all orders have valid destinations
      const invalidOrders = orderInputs.filter((order) => !order.destination || order.destination === 0);
      if (invalidOrders.length > 0) {
        console.error("Invalid orders found:", invalidOrders);
        toast.error(`Invalid destination for ${invalidOrders.length} order(s). Please check your city selections.`);
        setSubmitting(false);
        return;
      }

      const orderType = getOrderTypeForForm(data);
      console.log("Order type determined:", orderType);

      // 2. Submit all orders to the API (save to database)
      console.log("Step 2: Saving orders to database...");
      toast.info(`Saving ${orderInputs.length} order(s) to database...`);
      
      const createdOrders = [];
      for (let index = 0; index < orderInputs.length; index++) {
        const orderInput = orderInputs[index];
        try {
          console.log(`Creating order ${index + 1}/${orderInputs.length}:`, JSON.stringify(orderInput, null, 2));
          const result = await api.createOrder(orderType, orderInput);
          console.log(`Order ${index + 1} created successfully:`, JSON.stringify(result, null, 2));
          createdOrders.push(result);
        } catch (err) {
          console.error(`Error creating order ${index + 1}:`, orderInput, err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          toast.error(`Failed to create order ${index + 1}: ${errorMessage}`);
          // Continue with other orders instead of failing completely
        }
      }
      
      if (createdOrders.length === 0) {
        throw new Error("Failed to create any orders. Please check the console for details.");
      }
      
      console.log("Created orders:", JSON.stringify(createdOrders, null, 2));
      console.log(`Successfully created ${createdOrders.length} out of ${orderInputs.length} order(s)`);

      toast.success(`Successfully saved ${createdOrders.length} order(s) to database!`);

      // 3. Call solver API for each order
      console.log("Step 3: Calling solver API for optimization...");
      const goal = data.selectFieldGoal; // 'cost_efficient', 'speed', 'eco_friendly'
      // Map our goal to solver's expected format: 'cost' or 'time'
      const solverGoal = goal === 'speed' ? 'time' : 'cost';
      console.log("Solver goal:", solverGoal);

      toast.info("Processing orders with C++ solver...");

      const solverPromises = createdOrders.map(async (order, index) => {
        try {
          console.log(`Calling solver for order ${index + 1}/${createdOrders.length} (ID: ${order.orderId})...`);
          const solverPayload = {
            orderDetails: {
              orderId: order.orderId,
              sellerId: order.sellerId,
              source: order.source,
              destination: order.destination,
              weight: order.weight,
              volume: order.volume,
              priority: order.priority,
            },
            goal: solverGoal,
          };
          console.log("Solver payload:", JSON.stringify(solverPayload, null, 2));

          const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(solverPayload),
          });

          console.log(`Solver response status for order ${order.orderId}:`, response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Solver API error for order ${order.orderId}:`, errorText);
            throw new Error(`Solver API error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const result = await response.json();
          console.log(`Solver result for order ${order.orderId}:`, JSON.stringify(result, null, 2));
          return result;
        } catch (err) {
          console.error(`Solver API error for order ${order.orderId}:`, err);
          return { 
            error: `Failed to solve for order ${order.orderId}`, 
            orderId: order.orderId,
            details: err instanceof Error ? err.message : String(err)
          };
        }
      });

      const results = await Promise.all(solverPromises);
      console.log("All solver results:", JSON.stringify(results, null, 2));
      
      setSolverResults(results);
      setShowSolverResults(true);
      toast.success("Solver processing complete! Results displayed below.");

      // 4. Show map visualization (existing logic)
      console.log("Step 4: Generating map visualization...");
      const destinationName = data.orders[0]?.enterDestination;

      // Find Coordinates
      const originCity = NORTH_INDIA_CITIES.find(c => c.name === "Delhi"); // Default Origin
      const destCity = NORTH_INDIA_CITIES.find(c => c.name === destinationName);

      if (originCity && destCity) {
        // Generate Route based on Goal
        let routePath: [number, number][] = [originCity.coords, destCity.coords];
        let routeColor = "blue"; // Default
        let intermediateCities: string[] = [];

        if (goal === "speed") {
          routeColor = "red";
        } else if (goal === "cost_efficient") {
          routeColor = "blue";
          const hub = NORTH_INDIA_CITIES.find(c => c.name === "Agra");
          if (hub) {
            routePath = [originCity.coords, hub.coords, destCity.coords];
            intermediateCities.push("Agra");
          }
        } else if (goal === "eco_friendly") {
          routeColor = "green";
          const hub1 = NORTH_INDIA_CITIES.find(c => c.name === "Ambala");
          if (hub1) {
            routePath = [originCity.coords, hub1.coords, destCity.coords];
            intermediateCities.push("Ambala");
          }
        }

        setActiveRoute({
          path: routePath,
          color: routeColor,
          cityNames: [originCity.name, ...intermediateCities, destCity.name]
        });
        
        setTimeout(() => setIsMapVisible(true), 500);
        
        setTimeout(() => {
          document.getElementById("map-section")?.scrollIntoView({ behavior: 'smooth' });
        }, 600);
      } else {
        console.warn("Could not find cities for map visualization:", { originCity, destCity, destinationName });
      }

      console.log("=== FORM SUBMISSION COMPLETE ===");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit orders";
      console.error("=== ERROR IN FORM SUBMISSION ===");
      console.error("Error:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
      });
      toast.error(`Failed to submit orders: ${message}`);
    } finally {
      setSubmitting(false);
      console.log("Submission process finished (setSubmitting(false))");
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SafeContent>

        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-slate-900 z-10 relative">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Operations</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Route Planner</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {seller && (
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Logged in as: <span className="font-semibold">{seller.name} (ID: {seller.sellerId})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </header>

        <LayoutTextFlipDemo />

        <div className="p-4 space-y-8 flex flex-col pb-20">
          
          {/* --- 1. FORM SECTION --- */}
          <section className="w-full flex justify-center">
     <div className="w-full max-w-4xl">
        {/* 2. PASS THE PROP HERE */}
        <MultiForm 
           onFormSubmit={handleFormSubmit} 
           cityOptions={cityOptions}
        />
        {submitting && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Submitting orders to database and calling C++ solver...
              </span>
            </div>
          </div>
        )}
        {/* Debug: Test submission directly */}
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("=== MANUAL TEST SUBMISSION ===");
              console.log("Seller:", seller);
              if (!seller) {
                toast.error("Not logged in");
                return;
              }
              // Create a test form submission
              const testData: MultiFormSchema = {
                orders: [{
                  orderDescription: "Test Order",
                  enterDestination: "Jaipur",
                  orderWeightKg: 100,
                  orderVolumeM3: 5,
                  orderDeadlineOptional: undefined,
                }],
                isPriority: false,
                priorityQueue: [],
                selectFieldGoal: "cost_efficient",
              };
              console.log("Test data:", testData);
              handleFormSubmit(testData);
            }}
          >
            🧪 Test Submit (Bypass Form)
          </Button>
        </div>
     </div>
  </section>
          
          {/* --- 2. SOLVER RESULTS SECTION --- */}
          {showSolverResults && solverResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  🎯 C++ Solver Optimization Results
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSolverResults(false);
                    setSolverResults([]);
                  }}
                >
                  Hide Results
                </Button>
              </div>
              
              {solverResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-xl border-2 border-blue-500 p-6 shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                    Order {result.orderId || result.error ? `#${result.orderId || 'N/A'}` : `#${index + 1}`}
                    {result.winner && (
                      <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                        (Winner: {result.winner})
                      </span>
                    )}
                  </h3>
                  
                  {result.error ? (
                    <div className="text-red-600 dark:text-red-400 mb-4">
                      <p className="font-medium">Error:</p>
                      <p>{result.error}</p>
                      {result.details && (
                        <pre className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg overflow-auto text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Hub & Spoke Results */}
                      {result.hubSpoke && (
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Hub & Spoke Model
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>Total Time: {result.hubSpoke.totalTime?.toFixed(2) || 'N/A'}</p>
                            <p>Total Cost: {result.hubSpoke.totalCost?.toFixed(2) || 'N/A'}</p>
                            {result.hubSpoke.orderDetails && (
                              <p>Orders: {result.hubSpoke.orderDetails.length}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Point-to-Point Results */}
                      {result.pointToPoint && (
                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Point-to-Point Model
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>Total Time: {result.pointToPoint.totalTime?.toFixed(2) || 'N/A'}</p>
                            <p>Total Cost: {result.pointToPoint.totalCost?.toFixed(2) || 'N/A'}</p>
                            {result.pointToPoint.orderDetails && (
                              <p>Orders: {result.pointToPoint.orderDetails.length}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Personalized Results */}
                      {result.personalized && (
                        <div className="border-l-4 border-purple-500 pl-4">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Personalized Model
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>Time: {result.personalized.time?.toFixed(2) || 'N/A'}</p>
                            <p>Cost: {result.personalized.cost?.toFixed(2) || 'N/A'}</p>
                            {result.personalized.route && (
                              <p>Route: {result.personalized.route.join(' → ')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Full JSON - ALWAYS VISIBLE */}
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          📄 Full JSON Response from C++ Solver:
                        </h4>
                        <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-auto text-xs border border-slate-300 dark:border-slate-700 max-h-96">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* --- 3. MAP SECTION (Visible only after submit) --- */}
          {isMapVisible && (
            <div id="map-section" className="animate-in fade-in slide-in-from-bottom-10 duration-700">
               <div className="mb-4">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Route Optimization Result</h2>
                  <p className="text-slate-500">
                    Generated route based on your cargo manifest and logistics goal.
                  </p>
               </div>
               
               <div className="w-full h-[600px] bg-white rounded-2xl shadow-xl border overflow-hidden relative z-0">
                  <MapDisplay 
                      allCities={NORTH_INDIA_CITIES} 
                      activeRoute={activeRoute} 
                  />
               </div>
               
               <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => setIsMapVisible(false)}
                    className="text-sm text-slate-500 hover:text-slate-800 underline"
                  >
                    Reset & Edit Manifest
                  </button>
               </div>
            </div>
          )}

        </div>
      </SafeContent>
    </SidebarProvider>
  )
}