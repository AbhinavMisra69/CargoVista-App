import { spawn } from 'child_process';
import path from 'path';
import dbConnect from '@/lib/dbConnect';
import { SystemConfig } from "@/models/SystemConfig"; // ✅ FIXED (named import)
import { HubSpokeOrder, P2POrder, PersonalizedOrder } from "@/models/orders"; // ✅ ensure file exists with exact casing

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  await dbConnect();

  try {
    const { orderDetails, goal } = await req.json();

    // 1. Fetch Network Memory and all existing orders
    const [config, hsOrders, p2pOrders, persOrders] = await Promise.all([
      SystemConfig.findOne({ key: 'network_data' }),
      HubSpokeOrder.find({}),
      P2POrder.find({}),
      PersonalizedOrder.find({})
    ]);

    if (!config) return NextResponse.json({ error: "Network not initialized" }, { status: 500 });

    // 2. Prepare the Payload for solver.cpp
    const payload = {
      distMatrix: config.distMatrix,
      clusters: config.clusters,
      hubs: config.hubs,
      curSellerOrders: [orderDetails], // The new order being tested
      ordersHubSpoke: hsOrders,
      ordersP2P: p2pOrders,
      ordersPersonalised: persOrders,
      goal: goal || 'cost', // User's optimization preference
      prioritize: orderDetails.priority === 1
    };

    // 3. Spawn the Solver Binary
    const solverPath = path.resolve('./solver/bin/solver');
    const child = spawn(solverPath);

    let outputData = "";
    
    // Send payload to C++ stdin
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();

    // Capture C++ result from stdout
    for await (const chunk of child.stdout) {
      outputData += chunk;
    }

    const conclusion = JSON.parse(outputData);

    // 4. LOGIC: Determine the "Storage Bucket"
    // We choose the model based on the user's 'goal' (lowest cost or lowest time)
    let bestModel: 'hubSpoke' | 'pointToPoint' | 'personalized';
    
    if (goal === 'time') {
      const times = [
        { model: 'hubSpoke', val: conclusion.hubSpoke.totalTime },
        { model: 'pointToPoint', val: conclusion.pointToPoint.totalTime },
        { model: 'personalized', val: conclusion.personalized.time }
      ];
      bestModel = times.sort((a, b) => a.val - b.val)[0].model as any;
    } else {
      const costs = [
        { model: 'hubSpoke', val: conclusion.hubSpoke.totalCost },
        { model: 'pointToPoint', val: conclusion.pointToPoint.totalCost },
        { model: 'personalized', val: conclusion.personalized.cost }
      ];
      bestModel = costs.sort((a, b) => a.val - b.val)[0].model as any;
    }

    // 5. Save the order to the winner's "Storage Bucket"
    const orderData = { ...orderDetails, status: 'Pending' };
    
    if (bestModel === 'hubSpoke') await HubSpokeOrder.create(orderData);
    else if (bestModel === 'pointToPoint') await P2POrder.create(orderData);
    else await PersonalizedOrder.create(orderData);

    // 6. Return the full conclusion to the Frontend
    return NextResponse.json({
      winner: bestModel,
      ...conclusion
    });

  } catch (error) {
    console.error("Solver API Error:", error);
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
  }
}