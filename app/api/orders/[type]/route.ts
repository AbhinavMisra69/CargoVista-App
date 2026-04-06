import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { HubSpokeOrder, P2POrder, PersonalizedOrder } from "@/models/orders"; 

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    console.log("📥 API Received Payload:", body);

    const { type, ...orderData } = body;

    if (!type || !orderData) {
      return NextResponse.json(
        { error: "Missing 'type' or order data" }, 
        { status: 400 }
      );
    }

    let newOrder;

    // Save to the correct collection based on the 'type' sent from Frontend
    switch (type) {
      case "HubSpoke":
        newOrder = await HubSpokeOrder.create(orderData);
        break;
      case "P2P":
        newOrder = await P2POrder.create(orderData);
        break;
      case "Personalized":
        newOrder = await PersonalizedOrder.create(orderData);
        break;
      default:
        // Fallback or error if type matches nothing
        return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
    }

    console.log("✅ Saved Order:", newOrder._id);
    return NextResponse.json(newOrder.toObject(), { status: 201 });

  } catch (error: any) {
    console.error("❌ Database Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save order", details: error.message },
      { status: 500 }
    );
  }
}