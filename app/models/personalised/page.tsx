"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Crown, Settings, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default function PersonalizedCarrierPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-black text-white selection:bg-amber-900/30">
          
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
                  <BreadcrumbPage className="text-white font-medium">Personalized</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* --- HERO SECTION --- */}
          <div className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden bg-black/[0.96] border-b border-white/10">
            <div className="absolute inset-0 bg-[size:40px_40px] opacity-20 pointer-events-none select-none bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800 text-amber-500 text-sm font-medium mb-6">
                  <Crown className="w-4 h-4" /> Bespoke Logistics
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-6">
                  Personalized Carrier
                </h1>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                  Logistics designed around your business, not the other way around.
                  Tailor-made fleets, white-glove service, and dedicated routing.
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
                <h2 className="text-3xl font-bold mb-6">Bespoke Solutions</h2>
                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed">
                  <p>
                    Off-the-rack logistics solutions don't fit every business. When your cargo is high-value, fragile, or requires specialized handling, you need a <strong className="text-white">Personalized Carrier Model</strong>.
                  </p>
                  <p>
                    We partner directly with you to engineer a solution from the ground up. Instead of fitting your needs into our network, we build a dedicated fleet, process, or route specifically for you.
                  </p>
                </div>
              </motion.div>
              
              <div className="relative h-[400px] w-full bg-neutral-900/30 rounded-3xl border border-neutral-800 flex flex-col items-center justify-center p-8 text-center group">
                <UserCheck className="w-24 h-24 text-neutral-700 group-hover:text-amber-500 transition-colors duration-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Dedicated Resource</h3>
                <p className="text-neutral-500 max-w-xs">Your Driver. Your Truck. Your Schedule.</p>
              </div>
            </div>
          </div>

          {/* --- BENEFITS SECTION --- */}
          <div className="bg-neutral-900/30 border-y border-neutral-800 py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Premium Advantages</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: Settings,
                    title: "Maximum Flexibility",
                    desc: "Adaptable to seasonal peaks or specific product requirements."
                  },
                  {
                    icon: UserCheck,
                    title: "White-Glove Service",
                    desc: "Inside delivery, installation, and debris removal included."
                  },
                  {
                    icon: Crown,
                    title: "Brand Representation",
                    desc: "Uniformed drivers that act as an extension of your brand."
                  },
                  {
                    icon: Shield,
                    title: "Enhanced Control",
                    desc: "Absolute visibility and tighter chain of custody for high-value assets."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-black border border-neutral-800 hover:border-amber-500/50 transition-colors">
                    <item.icon className="w-8 h-8 text-amber-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
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
                "High-value luxury retail & electronics.",
                "Complex industrial machinery (Oversized).",
                "Pharmaceuticals requiring strict temperature control.",
                "Businesses needing a dedicated fleet without overhead."
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-neutral-300">{text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-16">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 h-12 bg-white text-black hover:bg-neutral-200 font-bold">
                  Request Custom Quote <ArrowRight className="ml-2 w-4 h-4"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}