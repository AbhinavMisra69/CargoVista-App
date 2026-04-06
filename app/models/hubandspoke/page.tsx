"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Network, Anchor, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar" // Import your sidebar
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar" // Import Provider & Inset
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default function HubAndSpokePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-black text-white selection:bg-blue-900/30">
          
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
                  <BreadcrumbPage className="text-white font-medium">Hub & Spoke</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* --- HERO SECTION --- */}
          <div className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden bg-black/[0.96] border-b border-white/10">
            <div className="absolute inset-0 bg-[size:40px_40px] opacity-20 pointer-events-none select-none bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800 text-blue-400 text-sm font-medium mb-6">
                  <Network className="w-4 h-4" /> Network Efficiency
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-6">
                  Hub & Spoke Logistics
                </h1>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                  Maximizing reach and minimizing costs through centralized consolidation.
                  The backbone of modern, scalable distribution networks.
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
                <h2 className="text-3xl font-bold mb-6">How It Works</h2>
                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed">
                  <p>
                    Imagine a bicycle wheel. The center represents the <strong className="text-white">"Hub"</strong>—a central sorting facility—and the radiating lines are the <strong className="text-white">"Spokes"</strong> leading to various destinations.
                  </p>
                  <p>
                    Instead of sending shipments directly from every origin to every destination (which creates inefficiency), all shipments are collected and transported to the central Hub. There, they are sorted, consolidated, and dispatched outbound to their final destination area.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Collection', 'Consolidation', 'Distribution'].map((step, i) => (
                    <div key={i} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                      <div className="text-2xl font-bold text-blue-500 mb-1">{i + 1}</div>
                      <div className="text-sm font-medium text-neutral-300">{step}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <div className="relative h-[400px] bg-neutral-900/50 rounded-3xl border border-neutral-800 overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl" />
                <Network className="w-32 h-32 text-neutral-700 group-hover:text-blue-500 transition-colors duration-700" />
              </div>
            </div>
          </div>

          {/* --- BENEFITS SECTION --- */}
          <div className="bg-neutral-900/30 border-y border-neutral-800 py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Key Benefits</h2>
                <p className="text-neutral-400">Why industry leaders choose the Hub & Spoke model.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: TrendingUp,
                    title: "Cost Efficiency",
                    desc: "Consolidating smaller shipments into full truckloads significantly reduces transportation costs per unit."
                  },
                  {
                    icon: Globe,
                    title: "Extended Reach",
                    desc: "Service a wider geographical area without establishing direct routes to every single town or city."
                  },
                  {
                    icon: Anchor,
                    title: "Standardized Ops",
                    desc: "Centralized sorting allows for highly automated processing and easier quality control."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-8 rounded-2xl bg-black border border-neutral-800 hover:border-blue-500/50 transition-colors">
                    <item.icon className="w-10 h-10 text-blue-500 mb-6" />
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
                "E-commerce businesses with high nationwide order volumes.",
                "Retailers replenishing multiple store locations from one center.",
                "Businesses prioritizing cost-effectiveness over pure speed.",
                "Scalable operations planning for future growth."
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-neutral-300">{text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-16">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 h-12 bg-white text-black hover:bg-neutral-200 font-bold">
                  Simulate Hub & Spoke Route <ArrowRight className="ml-2 w-4 h-4"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}