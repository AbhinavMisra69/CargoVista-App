"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils";
import { Spotlight } from "../components/ui/spotlight";
import WorldMap from "@/components/ui/world-map";
import { motion } from "motion/react";
import { ButtonM } from "../components//ui/moving-border";
import { ArrowRight, Package, Truck, MapPin, Shield } from "lucide-react";

function WorldMapDemo() {
  return (
    <div className="py-40 dark:bg-black bg-white w-full">
      <div className="max-w-7xl mx-auto text-center">
        <p className="font-bold text-xl md:text-4xl dark:text-white text-black">
          Global{" "}
          <span className="text-neutral-400">
            {"Logistics".split("").map((word, idx) => (
              <motion.span
                key={idx}
                className="inline-block"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </p>
        <p className="text-sm md:text-lg text-neutral-500 max-w-2xl mx-auto py-4">
          Streamline your supply chain with intelligent routing and real-time tracking.
          Perfect for modern logistics operations.
        </p>
      </div>
      <WorldMap
        dots={[
          {
            start: { lat: 28.6139, lng: 77.209 }, // New Delhi
            end: { lat: 19.0760, lng: 72.8777 }, // Mumbai
          },
          {
            start: { lat: 28.6139, lng: 77.209 }, // New Delhi
            end: { lat: 12.9716, lng: 77.5946 }, // Bangalore
          },
          {
            start: { lat: 19.0760, lng: 72.8777 }, // Mumbai
            end: { lat: 22.5726, lng: 88.3639 }, // Kolkata
          },
          {
            start: { lat: 12.9716, lng: 77.5946 }, // Bangalore
            end: { lat: 13.0827, lng: 80.2707 }, // Chennai
          },
        ]}
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative flex h-screen w-full overflow-hidden antialiased md:items-center md:justify-center">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-size-[40px_40px] select-none",
            "bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]",
          )}
        />
        <Spotlight
          className="-top-40 left-0 md:-top-20 md:left-60"
          fill="white"
        />
        
        <div className="relative z-10 mx-auto w-full max-w-7xl p-4 pt-20 md:pt-0">
          <div className="text-center space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-7xl"
            >
              CargoVista
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
            >
              Intelligent logistics platform for modern supply chain management.
              Track, optimize, and manage your shipments with ease.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-6 group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Why Choose CargoVista?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: "Smart Routing",
                description: "AI-powered route optimization for cost efficiency and speed.",
              },
              {
                icon: Truck,
                title: "Real-time Tracking",
                description: "Monitor your shipments in real-time across all carriers.",
              },
              {
                icon: MapPin,
                title: "Multi-Model Support",
                description: "Hub & Spoke, Point-to-Point, and Personalized carriers.",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Enterprise-grade security for your logistics data.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* World Map Section */}
      <WorldMapDemo />

      {/* CTA Section */}
      <div className="py-20 px-4 bg-slate-900 dark:bg-black">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to streamline your logistics?
          </h2>
          <p className="text-lg text-slate-400">
            Join thousands of sellers managing their shipments efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-slate-900 hover:bg-slate-100">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}