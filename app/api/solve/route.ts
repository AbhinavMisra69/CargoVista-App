import { spawn } from "child_process";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { SystemConfig } from "@/models/SystemConfig";
import {
  HubSpokeOrder,
  P2POrder,
  PersonalizedOrder,
} from "@/models/orders";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { orderDetails, goal } = body ?? {};

    if (!orderDetails) {
      return NextResponse.json(
        { error: "orderDetails is required" },
        { status: 400 }
      );
    }

    // 1. Fetch Network Memory and all existing orders
    const [config, hsOrders, p2pOrders, persOrders] = await Promise.all([
      SystemConfig.findOne({ key: "network_data" }),
      HubSpokeOrder.find({}).lean(),
      P2POrder.find({}).lean(),
      PersonalizedOrder.find({}).lean(),
    ]);

    if (!config) {
      return NextResponse.json(
        { error: "Network not initialized. Please seed the network data first." },
        { status: 500 }
      );
    }

    // 2. Prepare the Payload for solver.cpp
    const payload = {
      distMatrix: config.distMatrix,
      clusters: config.clusters,
      hubs: config.hubs,
      curSellerOrders: [orderDetails], // The new order being tested
      ordersHubSpoke: hsOrders,
      ordersP2P: p2pOrders,
      ordersPersonalised: persOrders,
      goal: goal || "cost", // User's optimization preference
      prioritize: orderDetails.priority === 1,
    };

    // 3. Spawn the Solver Binary
    const solverPath = path.resolve(process.cwd(), "solver/bin/solver");
    console.log("Solver path:", solverPath);

    const child = spawn(solverPath);

    let outputData = "";
    let errorData = "";

    // Send payload to C++ stdin
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();

    // Capture C++ result from stdout
    for await (const chunk of child.stdout) {
      outputData += chunk.toString();
    }

    // Capture errors from stderr
    for await (const chunk of child.stderr) {
      errorData += chunk.toString();
    }

    // Wait for process to exit
    const exitCode = await new Promise<number>((resolve) => {
      child.on("close", resolve);
    });

    if (exitCode !== 0 || errorData) {
      console.error("Solver error:", errorData);
      return NextResponse.json(
        {
          error: "Solver execution failed",
          details: errorData || `Process exited with code ${exitCode}`,
        },
        { status: 500 }
      );
    }

    if (!outputData) {
      return NextResponse.json(
        { error: "Solver returned no output" },
        { status: 500 }
      );
    }

    const conclusion = JSON.parse(outputData);

    // 4. LOGIC: Determine the "Storage Bucket"
    // We choose the model based on the user's 'goal' (lowest cost or lowest time)
    let bestModel: "hubSpoke" | "pointToPoint" | "personalized";

    if (goal === "time") {
      const times = [
        { model: "hubSpoke", val: conclusion.hubSpoke?.totalTime || Infinity },
        {
          model: "pointToPoint",
          val: conclusion.pointToPoint?.totalTime || Infinity,
        },
        { model: "personalized", val: conclusion.personalized?.time || Infinity },
      ];
      bestModel = times.sort((a, b) => a.val - b.val)[0]
        .model as typeof bestModel;
    } else {
      const costs = [
        { model: "hubSpoke", val: conclusion.hubSpoke?.totalCost || Infinity },
        {
          model: "pointToPoint",
          val: conclusion.pointToPoint?.totalCost || Infinity,
        },
        { model: "personalized", val: conclusion.personalized?.cost || Infinity },
      ];
      bestModel = costs.sort((a, b) => a.val - b.val)[0]
        .model as typeof bestModel;
    }

    // 5. Save the order to the winner's "Storage Bucket" (optional - we already saved it)
    // The order is already saved in our main flow, so we can skip this or update status

    // 6. Return the full conclusion to the Frontend
    return NextResponse.json({
      winner: bestModel,
      ...conclusion,
    });
  } catch (error: unknown) {
    console.error("Solver API Error:", error);
    const message =
      error instanceof Error ? error.message : "Optimization failed";
    return NextResponse.json(
      { error: "Optimization failed", details: message },
      { status: 500 }
    );
  }
}
