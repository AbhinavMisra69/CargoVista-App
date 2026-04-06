"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Clock, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default function PointToPointPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-black text-white selection:bg-red-900/30">
          
          {/* --- HEADER WITH BREADCRUMBS --- */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <SidebarTrigger className="-ml-1 text-neutral-400 hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-white/10" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-neutral-500 hover:text-neutral-300">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-neutral-600" />
                <BreadcrumbItem>
                  <BreadcrumbLink className="text-neutral-500 hover:text-neutral-300">Models</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-neutral-600" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white font-medium">Point to Point</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* --- HERO SECTION --- */}
          <div className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden bg-black/[0.96] border-b border-white/10">
            <div className="absolute inset-0 bg-[size:40px_40px] opacity-20 pointer-events-none select-none bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-red-800 text-red-400 text-sm font-medium mb-6">
                  <Zap className="w-4 h-4" /> High Speed Delivery
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-6">
                  Point-to-Point (P2P)
                </h1>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                  The fastest distance between two points is a straight line.
                  Direct, non-stop delivery when speed is paramount.
                </p>
              </motion.div>
            </div>
          </div>

          {/* --- EXPLANATION SECTION --- */}
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-6">The Direct Route</h2>
                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed">
                  <p>
                    When time is critical, the P2P model delivers. Unlike Hub & Spoke, P2P bypasses intermediary sorting facilities entirely.
                  </p>
                  <p>
                    A shipment travels directly from the <strong className="text-white">Origin (Point A)</strong> to the <strong className="text-white">Destination (Point B)</strong>. This is the "express lane" of logistics, designed to minimize transit time and handling risk.
                  </p>
                </div>
              </motion.div>
              
              <div className="relative h-[300px] w-full bg-neutral-900/30 rounded-3xl border border-neutral-800 flex items-center justify-center overflow-hidden p-8">
                <div className="flex items-center gap-4 w-full justify-between max-w-md relative z-10">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-white flex items-center justify-center mb-2">
                            <MapPin className="w-6 h-6 text-white"/>
                        </div>
                        <div className="text-sm font-bold">Origin</div>
                    </div>
                    
                    <div className="flex-1 h-1 bg-neutral-700 relative mx-4">
                        <div className="absolute top-0 left-0 h-full w-full bg-red-500 animate-pulse" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-900/50 border border-red-500 rounded text-[10px] text-red-200">
                            DIRECT
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-red-500 flex items-center justify-center mb-2">
                            <MapPin className="w-6 h-6 text-red-500"/>
                        </div>
                        <div className="text-sm font-bold text-red-500">Dest</div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- BENEFITS SECTION --- */}
          <div className="bg-neutral-900/30 border-y border-neutral-800 py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Why Choose P2P?</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Clock,
                    title: "Unmatched Speed",
                    desc: "Eliminating intermediate stops and sorting offers the fastest possible ground transit times."
                  },
                  {
                    icon: ShieldCheck,
                    title: "Reduced Handling",
                    desc: "Loaded once, unloaded once. Minimizes risk of damage or loss during transfers."
                  },
                  {
                    icon: Zap,
                    title: "Predictability",
                    desc: "Direct routes offer highly predictable arrival times, crucial for JIT supply chains."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-8 rounded-2xl bg-black border border-neutral-800 hover:border-red-500/50 transition-colors">
                    <item.icon className="w-10 h-10 text-red-500 mb-6" />
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- IDEAL FOR --- */}
          <div className="py-24 max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">Ideal For</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                "Time-sensitive shipments (perishables, medical).",
                "Full Truckload (FTL) shipments.",
                "Short-haul regional deliveries.",
                "Just-In-Time (JIT) manufacturing supply chains."
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-neutral-300">{text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-16">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 h-12 bg-white text-black hover:bg-neutral-200 font-bold">
                  Book a Direct Route <ArrowRight className="ml-2 w-4 h-4"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}