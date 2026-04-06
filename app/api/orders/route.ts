import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { HubSpokeOrder, P2POrder, PersonalizedOrder } from "@/models/orders"; 

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    console.log("DEBUG: /api/orders HIT", body.type);

    const { type, ...orderData } = body;

    let newOrder;
    if (type === "HubSpoke") newOrder = await HubSpokeOrder.create(orderData);
    else if (type === "P2P") newOrder = await P2POrder.create(orderData);
    else if (type === "Personalized") newOrder = await PersonalizedOrder.create(orderData);
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    return NextResponse.json(newOrder.toObject(), { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
