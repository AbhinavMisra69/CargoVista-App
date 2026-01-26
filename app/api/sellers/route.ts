import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Seller } from "@/models/Seller";

// GET /api/sellers  -> list all sellers
export async function GET() {
  try {
    await connectToDatabase();

    const sellers = await Seller.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(sellers);
  } catch (err: unknown) {
    console.error("Error fetching sellers", err);
    const message = err instanceof Error ? err.message : "Failed to fetch sellers";
    return NextResponse.json(
      { error: "Failed to fetch sellers", details: message },
      { status: 500 }
    );
  }
}

// POST /api/sellers  -> create a seller
// body: { sellerId: number, name: string, email?: string }
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { sellerId, name, email } = body ?? {};

    if (typeof sellerId !== "number" || !name) {
      return NextResponse.json(
        { error: "sellerId (number) and name (string) are required" },
        { status: 400 }
      );
    }

    const seller = await Seller.create({ sellerId, name, email });
    return NextResponse.json(seller, { status: 201 });
  } catch (err: unknown) {
    console.error("Error creating seller", err);
    const message = err instanceof Error ? err.message : "Failed to create seller";
    return NextResponse.json(
      { error: "Failed to create seller", details: message },
      { status: 500 }
    );
  }
}

