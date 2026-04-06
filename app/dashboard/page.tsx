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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card"
import { Loader2, Clock, IndianRupee, Trophy, AlertTriangle, Truck, Package, MapPin, Zap, Ban, Siren } from "lucide-react"

import { MultiForm, MultiFormSchema } from "@/components/multiform";
import { NORTH_INDIA_CITIES, City } from "@/components/cityData"

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-500 text-sm">
      Loading Route Map...
    </div>
  )
});

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

// --- TYPES ---
interface PayloadOrder {
  orderId: number;
  sellerId: number;
  source: number;
  destination: number;
  weight: number;
  volume: number;
  priority: number;
  description?: string;
  sourceName?: string;
  destName?: string;
}

// FIX: Added 'path' to the interface to solve TypeScript error 2339
interface BackendRoute {
  orderId?: number | string;
  model?: string;
  route?: string[] | { route: string[] } | any; 
  path?: string[]; // <--- Added this property
}

interface BackendOrderDetail {
  orderId: number | string;
  model: "HubSpoke" | "PointToPoint";
  time: number;
  cost: number;
}

interface HybridModelResult {
  totalCost: number;       
  totalTime: number;       
  orderDetails: BackendOrderDetail[]; 
  routes: BackendRoute[];             
}

interface PersonalizedResult {
  totalCost: number;
  totalTime: number;
  routes: BackendRoute[]; 
}

interface SolverResponse {
  costEfficient: HybridModelResult;
  timeEfficient: HybridModelResult;
  hubSpoke: HybridModelResult;
  pointToPoint: HybridModelResult;
  personalized: PersonalizedResult;
}

export default function Page() {
  const { seller, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<SolverResponse | null>(null)
  const [userGoal, setUserGoal] = useState<"cost_efficient" | "speed" | "eco_friendly" | "">("")
  const [submittedOrders, setSubmittedOrders] = useState<PayloadOrder[]>([])
  const [isPriorityMode, setIsPriorityMode] = useState(false)

  const cityOptions = NORTH_INDIA_CITIES.map(c => c.name).sort();

  useEffect(() => {
    if (!authLoading && !seller) router.push("/login");
  }, [seller, authLoading, router]);

  if (authLoading || !seller) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;
  }

  // --- SUBMIT ---
  const handleFormSubmit = async (formData: MultiFormSchema) => {
    setSubmitting(true);
    setResults(null);
    setUserGoal(formData.selectFieldGoal as any);
    setIsPriorityMode(formData.isPriority); 

    try {
      const ordersPayload: PayloadOrder[] = formData.orders.map((order, index) => {
        const sourceCity = NORTH_INDIA_CITIES.find(c => c.name === order.enterSource);
        const destCity = NORTH_INDIA_CITIES.find(c => c.name === order.enterDestination);
        
        let priorityVal = 100 + index; 
        if (formData.isPriority && formData.priorityQueue) {
            const rankIndex = formData.priorityQueue.indexOf(index);
            if (rankIndex !== -1) priorityVal = rankIndex + 1;
        } 

        return {
          orderId: Date.now() + index + Math.floor(Math.random() * 1000), 
          sellerId: seller.sellerId || 101,
          source: sourceCity ? sourceCity.id : 1,           
          destination: destCity ? destCity.id : 1,
          weight: order.orderWeightKg,
          volume: order.orderVolumeM3,
          priority: priorityVal, 
          description: order.orderDescription,
          sourceName: order.enterSource,
          destName: order.enterDestination
        };
      });

      setSubmittedOrders(ordersPayload);
      
      const payload = {
        currentOrders: ordersPayload, 
        goal: formData.selectFieldGoal === "cost_efficient" ? "cost" : "time",
        prioritize: formData.isPriority 
      };

      for (const ord of ordersPayload) {
        let dbType = "HubSpoke";
        if (formData.selectFieldGoal === "speed") dbType = "P2P";
        if (formData.isPriority) dbType = "Personalized";
        await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: dbType, ...ord }) });
      }
      toast.success("Orders processed");

      const solveResponse = await fetch('/api/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!solveResponse.ok) throw new Error(`Solver failed: ${await solveResponse.text()}`);

      const data: SolverResponse = await solveResponse.json();
      setResults(data);
      setTimeout(() => document.getElementById("results-section")?.scrollIntoView({ behavior: 'smooth' }), 200);

    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getFormatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // --- VIEW LOGIC ---
  let finalDisplayCost = 0;
  let finalDisplayTime = 0;
  let ViewComponent = null;

  if (results) {
      if (isPriorityMode) {
          // --- PRIORITY MODE ---
          const pData = results.personalized;
          finalDisplayCost = pData?.totalCost || 0;
          finalDisplayTime = pData?.totalTime || 0;
          
          // Fix: Ensure we get the array from the first route object
          const pRouteObj = pData?.routes?.[0];
          const pPathArray = pRouteObj ? (pRouteObj.route || pRouteObj.path || []) : [];

          ViewComponent = (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Siren className="w-6 h-6 text-red-500" /> Priority Fleet Sequence
                </h3>
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg mb-4 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" /> <strong>Active:</strong> Standard routing disabled. Optimization strictly follows priority ranks.
                </div>
                <ResultCard 
                    title="Priority Milk-Run Route"
                    description="Optimized delivery sequence respecting your priority ranks."
                    cost={finalDisplayCost}
                    time={finalDisplayTime}
                    path={pPathArray} 
                    color="red"
                    cities={NORTH_INDIA_CITIES}
                    badge="Expedited"
                    isPriority={true}
                    fallbackPoints={submittedOrders.length >= 2 ? [submittedOrders[0].sourceName, submittedOrders[submittedOrders.length-1].destName] : []}
                />
             </div>
          );
      } else {
          // --- STANDARD MODE ---
          const modelKey = userGoal === 'speed' ? 'timeEfficient' : 'costEfficient';
          const modelData = results[modelKey];
          finalDisplayCost = modelData?.totalCost || 0;
          finalDisplayTime = modelData?.totalTime || 0;

          ViewComponent = (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Package className="w-6 h-6" /> Individual Order Optimizations
                </h3>
                
                {submittedOrders.map((order, index) => {
                  const orderSpecifics = modelData?.orderDetails?.find(d => String(d.orderId) === String(order.orderId));
                  const routeObj = modelData?.routes?.find(r => String(r.orderId) === String(order.orderId)) || modelData?.routes[index];
                  const finalStats = orderSpecifics || modelData?.orderDetails[index];

                  // Safe extract route
                  const safeRouteArray = routeObj ? (routeObj.route || routeObj.path || []) : [];

                  const routeCost = finalStats?.cost || 0;
                  const routeTime = finalStats?.time || 0;
                  const usedModel = finalStats?.model || (userGoal === 'speed' ? "PointToPoint" : "HubSpoke");
                  const isOverflow = routeTime < 0 || routeTime > 10000;
                  
                  return (
                      <ResultCard 
                          key={order.orderId}
                          title={`Order #${index + 1}: ${order.description || "Shipment"}`}
                          subtitle={`${order.sourceName} ➝ ${order.destName}`}
                          description={isOverflow ? "Destination Unreachable" : `Optimized via ${usedModel}`}
                          cost={routeCost}
                          time={routeTime}
                          path={safeRouteArray} 
                          color={isOverflow ? "gray" : (userGoal === 'speed' ? 'red' : 'blue')}
                          cities={NORTH_INDIA_CITIES}
                          badge={isOverflow ? "Error" : (usedModel === 'PointToPoint' ? "Direct Route" : "Hub Consolidated")}
                          isError={isOverflow}
                          fallbackPoints={[order.sourceName, order.destName]} 
                      />
                  )
                })}

                {results.personalized && (
                    <div className="space-y-8 pt-8 border-t border-slate-800">
                        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Truck className="w-6 h-6 text-yellow-500" /> Private Fleet Option
                        </h3>
                        {(() => {
                            const pRouteObj = results.personalized.routes?.[0];
                            const pPathArray = pRouteObj ? (pRouteObj.route || pRouteObj.path || []) : [];
                            return (
                                <ResultCard 
                                    title="Dedicated Carrier Route"
                                    description="A single consolidated route covering your entire manifest."
                                    cost={results.personalized.totalCost || 0}
                                    time={results.personalized.totalTime || 0}
                                    path={pPathArray} 
                                    color="gold"
                                    cities={NORTH_INDIA_CITIES}
                                    badge="Premium Service"
                                    fallbackPoints={submittedOrders.length >= 2 ? [submittedOrders[0].sourceName, submittedOrders[submittedOrders.length-1].destName] : []}
                                />
                            )
                        })()}
                    </div>
                )}
             </div>
          );
      }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SafeContent>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-slate-900 z-10 sticky top-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Operations</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Route Planner</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden md:block">User: <span className="font-semibold">{seller.name}</span></div>
              <Button variant="outline" size="sm" onClick={() => { logout(); router.push("/"); }}>Logout</Button>
            </div>
        </header>

        {/* INLINED HEADER COMPONENT */}
        <div className="relative mx-4 my-4 flex flex-col items-center justify-center gap-4 text-center sm:mx-0 sm:mb-0 sm:flex-row">
        <LayoutTextFlip words={["Hello", "Hola", "Ciao", "Namaste"]} text= {seller.name}  />   
        </div>

        <div className="p-6 space-y-12 pb-24 max-w-7xl mx-auto">
          <section className="w-full">
             <MultiForm onFormSubmit={handleFormSubmit} cityOptions={cityOptions} />
          </section>

          {submitting && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
              <p className="text-slate-500 animate-pulse text-lg font-medium">Calculating Optimal Logistics Networks...</p>
            </div>
          )}
          
          {results && (
            <div id="results-section" className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-16">
               <div className="border-b pb-4">
                  <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Optimization Results</h2>
                  <p className="text-slate-500 text-lg">Strategy: <span className="font-semibold text-blue-600">{isPriorityMode ? 'Priority Sequence (Exclusive)' : (userGoal === 'cost_efficient' ? 'Cost Efficiency' : 'Time Efficiency')}</span></p>
               </div>

               {/* RENDER VIEW */}
               {ViewComponent}

               {/* SUMMARY */}
               <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-700 pb-2">Manifest Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <p className="text-slate-400 text-sm mb-1">Total Estimated Cost</p>
                          <div className="text-5xl font-bold text-emerald-400">{getFormatCurrency(finalDisplayCost)}</div>
                      </div>
                      <div>
                          <p className="text-slate-400 text-sm mb-3">Time Estimate</p>
                          <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <span className="text-slate-300 text-sm font-medium">{isPriorityMode ? "Total Sequence Time" : "Max Network Time"}</span>
                            <span className="font-mono font-bold text-white flex items-center gap-2">
                                <Clock className="w-3 h-3 text-yellow-400" /> {finalDisplayTime} Day(s)
                            </span>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </SafeContent>
    </SidebarProvider>
  )
}

function ResultCard({ title, subtitle, description, cost, time, path, color, cities, badge, isError, fallbackPoints }: any) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  
  let safePath: string[] = [];
  try {
      if (Array.isArray(path)) safePath = path.filter(i => typeof i === 'string');
      else if (path && typeof path === 'object') {
          if (Array.isArray(path.route)) safePath = path.route.filter((i:any) => typeof i === 'string');
          else if (Array.isArray(path.path)) safePath = path.path.filter((i:any) => typeof i === 'string');
          else safePath = Object.values(path).filter(v => typeof v === 'string') as string[];
      }
  } catch (e) { console.error("Path parsing error", e); }

  const displayPath = safePath.length > 0 ? safePath : (fallbackPoints || []);
  const isFallback = safePath.length === 0 && displayPath.length > 0;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 shadow-lg border-2 border-slate-200 dark:border-slate-800`}>
      <div className="flex flex-col lg:flex-row min-h-[400px]">
        <div className="p-8 lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative z-20">
          <div className="mb-8">
             <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isError ? 'bg-slate-200 text-slate-500' : (color === 'blue' ? 'bg-blue-100 text-blue-600' : (color === 'red' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'))}`}>
                   {isError ? <AlertTriangle className="w-6 h-6"/> : (color === 'gold' ? <Truck className="w-6 h-6" /> : (color === 'red' ? <Zap className="w-6 h-6"/> : <Package className="w-6 h-6" />))}
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
                   {subtitle && <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{subtitle}</p>}
                </div>
             </div>
             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
             {isFallback && !isError && <p className="text-xs text-amber-500 mt-2 italic">Note: Detailed route data unavailable. Showing direct path.</p>}
          </div>
          {!isError && (
            <div className="grid grid-cols-1 gap-4 mt-auto">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><IndianRupee className="w-4 h-4" /> <span className="text-xs uppercase font-bold tracking-wider">Cost</span></div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(cost || 0)}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><Clock className="w-4 h-4" /> <span className="text-xs uppercase font-bold tracking-wider">Time</span></div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{time || 0} Day(s)</div>
                </div>
            </div>
          )}
          {isError && (
              <div className="mt-auto p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <strong>Route Calculation Failed.</strong><br/>The locations appear to be disconnected in the network graph.
              </div>
          )}
        </div>
        <div className="lg:w-2/3 bg-slate-50 dark:bg-slate-900 relative">
           {(displayPath.length === 0) ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[400px]">
               <Ban className="w-10 h-10 opacity-30" /> 
               <span className="font-medium">No valid route path found.</span>
             </div>
           ) : (
             <>
                <div className="absolute inset-0 z-0">
                    <MapDisplay allCities={cities} activeRoute={{ pathNames: displayPath, color: isError ? "gray" : (isFallback ? "orange" : color) }} />
                </div>
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                        {badge && <div className={`px-4 py-1 text-xs font-bold text-white uppercase tracking-wider rounded-lg shadow-md ${isError ? 'bg-slate-600' : (color === 'red' ? 'bg-red-500' : (color === 'gold' ? 'bg-yellow-600' : 'bg-blue-600'))}`}>{badge}</div>}
                    </div>
                    <div className="pointer-events-auto bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-xl border border-slate-200 max-w-fit self-start">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Route Path</div>
                        <div className="text-xs font-semibold text-slate-800 flex flex-wrap gap-1 leading-relaxed">
                            {displayPath.map((city: string, i: number) => (
                                <span key={i} className="flex items-center">{city} {i < displayPath.length - 1 && <span className="mx-1 text-slate-400">→</span>}</span>
                            ))}
                        </div>
                    </div>
                </div>
             </>
           )}
        </div>
      </div>
    </Card>
  )
}