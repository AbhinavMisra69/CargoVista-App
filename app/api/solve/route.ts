// app/api/solve/route.ts

import { spawn } from "child_process";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { SystemConfig } from "@/models/SystemConfig";
import { HubSpokeOrder, P2POrder, PersonalizedOrder } from "@/models/orders";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    
    // --- FIX: Destructure 'currentOrders' array instead of single 'orderDetails' ---
    const { currentOrders, goal } = body ?? {};

    if (!currentOrders || !Array.isArray(currentOrders) || currentOrders.length === 0) {
      return NextResponse.json({ error: "currentOrders array is required" }, { status: 400 });
    }

    // 1. Fetch Network Memory
    const [config, hsOrders, p2pOrders, persOrders] = await Promise.all([
      SystemConfig.findOne({ key: "network_data" }),
      HubSpokeOrder.find({}).lean(),
      P2POrder.find({}).lean(),
      PersonalizedOrder.find({}).lean(),
    ]);

    if (!config) {
      return NextResponse.json({ error: "Network not initialized." }, { status: 500 });
    }

    // 2. Prepare Payload for Solver
    // Create priority map for ALL orders in the current batch
    const orderPriorityMap: Record<string, number> = {};
    currentOrders.forEach((order: any) => {
        orderPriorityMap[order.orderId.toString()] = order.priority || 0;
    });

    const payload = {
      distMatrix: config.distMatrix,
      clusters: config.clusters,
      hubs: config.hubs,
      curSellerOrders: currentOrders, // Pass the FULL ARRAY here
      ordersHubSpoke: hsOrders,
      ordersP2P: p2pOrders,
      ordersPersonalised: persOrders,
      goal: goal || "cost",
      prioritize: currentOrders.some((o: any) => o.priority === 1), // True if ANY order is priority
      orderPriority: orderPriorityMap
    };
    console.log("Payload: ",payload);
    console.log("orderPriority:",payload["orderPriority"]);

    // 3. Spawn Solver
    const solverPath = path.resolve(process.cwd(), "solver/bin/solver");
    const child = spawn(solverPath);

    let outputData = "";
    let errorData = "";

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();

    for await (const chunk of child.stdout) {
      outputData += chunk.toString();
    }
    for await (const chunk of child.stderr) {
      errorData += chunk.toString();
    }

    const exitCode = await new Promise<number>((resolve) => {
      child.on("close", resolve);
    });

    if (exitCode !== 0) {
      console.error("❌ Solver C++ Error:", errorData);
      return NextResponse.json(
        { error: "Solver failed", details: errorData },
        { status: 500 }
      );
    }

    let conclusion;
    try {
        conclusion = JSON.parse(outputData);
    } catch (e) {
        console.error("❌ JSON Parse Failed. Raw Output:", outputData);
        return NextResponse.json({ error: "Invalid JSON from solver" }, { status: 500 });
    }
    console.log("output:", conclusion);
    // Check if hubSpoke data exists
    // Check if hubSpoke data exists
    if (conclusion.hubSpoke && Array.isArray(conclusion.hubSpoke.routes)) {
      console.log("🚚 --- Hub & Spoke Routes ---");
      
      // FIX: Add ': any' and ': number' types
      conclusion.hubSpoke.routes.forEach((routeItem: any, index: number) => {
          const path = routeItem.route || routeItem.path;
          const id = routeItem.orderId || "Unknown ID";
          
          console.log(`Order #${index + 1} (ID: ${id}):`, path);
      });
  } else {
      console.log("⚠️ No Hub & Spoke routes found in conclusion.");
  }

    // Determine Winner Logic (remains same)
    let bestModel: "hubSpoke" | "pointToPoint" | "personalized";
    if (goal === "time") {
      const times = [
        { model: "hubSpoke", val: conclusion.hubSpoke?.totalTime || Infinity },
        { model: "pointToPoint", val: conclusion.pointToPoint?.totalTime || Infinity },
        { model: "personalized", val: conclusion.personalized?.time || Infinity },
      ];
      bestModel = times.sort((a, b) => a.val - b.val)[0].model as typeof bestModel;
    } else {
      const costs = [
        { model: "hubSpoke", val: conclusion.hubSpoke?.totalCost || Infinity },
        { model: "pointToPoint", val: conclusion.pointToPoint?.totalCost || Infinity },
        { model: "personalized", val: conclusion.personalized?.cost || Infinity },
      ];
      bestModel = costs.sort((a, b) => a.val - b.val)[0].model as typeof bestModel;
    }

    return NextResponse.json({ winner: bestModel, ...conclusion });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}