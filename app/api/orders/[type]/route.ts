import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Seller } from "@/models/Seller";
import {
  HubSpokeOrder,
  P2POrder,
  PersonalizedOrder,
} from "@/models/orders";

const MODEL_MAP = {
  "hub-spoke": HubSpokeOrder,
  "p2p": P2POrder,
  "personalized": PersonalizedOrder,
} as const;

type OrderTypeParam = keyof typeof MODEL_MAP;

function getModel(type: string | null) {
  if (!type) return null;
  const normalized = type.toLowerCase() as OrderTypeParam;
  return MODEL_MAP[normalized] ?? null;
}

// GET /api/orders/[type]?sellerId=123
//  -> list orders of a given model, optionally filtered by sellerId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await connectToDatabase();

    const { type } = await params;
    const Model = getModel(type);
    if (!Model) {
      return NextResponse.json(
        { error: "Invalid order type. Use hub-spoke, p2p, or personalized." },
        { status: 400 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const sellerIdParam = searchParams.get("sellerId");

    const filter: Record<string, number> = {};
    if (sellerIdParam) {
      filter.sellerId = Number(sellerIdParam);
    }

    const orders = await Model.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(orders);
  } catch (err: unknown) {
    console.error("Error fetching orders", err);
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json(
      { error: "Failed to fetch orders", details: message },
      { status: 500 }
    );
  }
}

// POST /api/orders/[type]
// body: {
//   orderId: number,
//   sellerId: number,
//   source: number,
//   destination: number,
//   weight: number,
//   volume: number,
//   priority?: number,
//   timestamp?: Date/string
// }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    console.log("[API] Attempting to connect to database...");
    await connectToDatabase();
    console.log("[API] Database connected successfully");

    const { type } = await params;
    console.log("[API] Order type:", type);
    
    const Model = getModel(type);
    if (!Model) {
      return NextResponse.json(
        { error: "Invalid order type. Use hub-spoke, p2p, or personalized." },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("[API] Request body:", JSON.stringify(body, null, 2));
    
    const {
      orderId,
      sellerId,
      source,
      destination,
      weight,
      volume,
      priority,
      timestamp,
    } = body ?? {};

    // Basic validation
    const requiredNumbers = { orderId, sellerId, source, destination, weight, volume };
    for (const [key, value] of Object.entries(requiredNumbers)) {
      if (typeof value !== "number") {
        console.error(`[API] Validation failed: ${key} is not a number:`, value);
        return NextResponse.json(
          { error: `${key} (number) is required` },
          { status: 400 }
        );
      }
    }

    // Make sure seller exists
    console.log("[API] Checking if seller exists:", sellerId);
    const seller = await Seller.findOne({ sellerId });
    if (!seller) {
      console.error(`[API] Seller not found: ${sellerId}`);
      return NextResponse.json(
        { error: `Seller with sellerId=${sellerId} not found` },
        { status: 404 }
      );
    }
    console.log("[API] Seller found:", seller.name);

    console.log("[API] Creating order in database...");
    const order = await Model.create({
      orderId,
      sellerId,
      source,
      destination,
      weight,
      volume,
      priority: priority || 3,
      status: 'Pending',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    console.log("[API] Order created successfully:", order.orderId);
    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    console.error("[API] Error creating order:", err);
    const errorCode = (err as any)?.code;
    const errorMessage = err instanceof Error ? err.message : "Failed to create order";
    
    // Provide helpful error message for connection issues
    if (errorCode === 'ETIMEOUT' || errorMessage.includes('ETIMEOUT')) {
      return NextResponse.json(
        { 
          error: "Database connection timeout",
          details: "Unable to connect to MongoDB. Please check your network connection and MongoDB Atlas settings.",
          troubleshooting: "See MONGODB_TROUBLESHOOTING.md for help",
          code: errorCode
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create order", 
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}

