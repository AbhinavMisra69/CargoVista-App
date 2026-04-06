"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";
// FIX: Import WorldMap dynamically with ssr: false to prevent hydration errors
import dynamic from "next/dynamic";
const WorldMap = dynamic(() => import("@/components/ui/world-map"), { ssr: false });
import { motion } from "framer-motion";
import {
  ArrowRight,
  Package,
  Truck,
  MapPin,
  Shield,
  Twitter,
  Linkedin,
  Github,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-white/10 selection:text-white">

  {/* ================= HERO ================= */}
<section className="relative w-full min-h-[100vh] flex items-center justify-center py-32 overflow-hidden border-b border-white/10">

{/* Grid */}
<div
  className={cn(
    "absolute inset-0 bg-[size:40px_40px] opacity-[0.12]",
    "bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]"
  )}
/>

{/* Spotlight */}
<Spotlight
  className="-top-48 left-1/2 -translate-x-1/2"
  fill="white"
/>

{/* Radial Glow */}
<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />

{/* Content */}
<div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

  <motion.h1
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className="bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400 text-5xl md:text-7xl font-bold tracking-tight"
  >
    CargoVista
    <span className="block mt-2 text-2xl md:text-4xl font-medium text-neutral-300">
      Logistics Optimization Platform
    </span>
  </motion.h1>

  <motion.p
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15, duration: 0.6 }}
    className="mt-8 max-w-2xl mx-auto text-base md:text-lg text-neutral-400 leading-relaxed"
  >
    The advanced decision support system that evaluates Hub-and-Spoke, Point-to-Point, 
    and Personalized models to recommend the most efficient delivery strategy.
  </motion.p>

  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.6 }}
    className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
  >
    <Link href="/signup">
      <Button
        size="lg"
        className="h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all hover:-translate-y-[2px]"
      >
        Run Simulation
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>

    <Link href="/login">
      <Button
        size="lg"
        variant="outline"
        className="h-12 px-8 rounded-full border-white/20 text-neutral-300 hover:bg-white/10 hover:text-white"
      >
        Sign In
      </Button>
    </Link>
  </motion.div>

</div>
</section>

      {/* ================= FEATURES ================= */}
      <section className="py-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose CargoVista?
            </h2>
            <p className="text-neutral-400 text-lg">
              Eliminate guesswork with our high-performance algorithmic engine designed for precision logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Algorithmic Decision", desc: "Uses Graph Algorithms (Dijkstra, Floyd-Warshall) to find the best path.", icon: Package },
              { title: "Priority Handling", desc: "Dynamic routing based on shipment urgency and vehicle capacity.", icon: Truck },
              { title: "Multi-Model Sim", desc: "Simulates Hub-and-Spoke vs. Point-to-Point in parallel.", icon: MapPin },
              { title: "Cost Optimization", desc: "Data-driven recommendations to reduce operational overhead.", icon: Shield },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.04] transition-all"
              >
                <div className="mb-6 h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 group-hover:bg-white/10 transition">
                  <f.icon className="w-7 h-7 text-neutral-200" />
                </div>

                <h3 className="text-xl font-semibold mb-2">
                  {f.title}
                </h3>

                <p className="text-neutral-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MAP ================= */}
      <section className="py-28 border-b border-white/10 relative overflow-hidden">

        <div className="text-center max-w-3xl mx-auto mb-14 px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            Regional <span className="text-neutral-500">Focus, Global Vision</span>
          </h2>
          <p className="text-neutral-400 text-lg">
            Currently optimizing supply chains across North India, with a scalable architecture ready for the world.
          </p>
        </div>

        <div className="relative w-full h-[520px] md:h-[680px] bg-white/[0.02] border-y border-white/10">
          <WorldMap
            dots={[
              { start: { lat: 64.2, lng: -149.4 }, end: { lat: 34.05, lng: -118.24 } },
              { start: { lat: 64.2, lng: -149.4 }, end: { lat: -15.79, lng: -47.89 } },
              { start: { lat: -15.79, lng: -47.89 }, end: { lat: 38.72, lng: -9.13 } },
              { start: { lat: 51.5, lng: -0.12 }, end: { lat: 28.61, lng: 77.2 } },
              { start: { lat: 28.61, lng: 77.2 }, end: { lat: 43.13, lng: 131.91 } },
              { start: { lat: 28.61, lng: 77.2 }, end: { lat: -1.29, lng: 36.82 } },
            ]}
          />
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="mb-24 p-10 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl grid md:grid-cols-2 gap-12 items-center">

            <div>
              <h3 className="text-3xl font-bold mb-3">
                Ready to optimize your routes?
              </h3>
              <p className="text-neutral-400 text-lg max-w-md">
                Make objective, data-driven decisions with CargoVista today.
              </p>

              <div className="flex items-center gap-2 mt-4 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Transparent & Measurable
              </div>
            </div>

            <div className="flex md:justify-end">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-14 px-12 rounded-full bg-white text-black font-semibold hover:bg-neutral-200"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-semibold">CargoVista</span>
            </div>

            <p className="text-neutral-500 text-sm">
              © 2026 CargoVista Logistics. All rights reserved.
            </p>

            <div className="flex gap-4">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}