import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Seller } from "@/models/Seller";

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

    // Check if seller with this sellerId already exists
    const existing = await Seller.findOne({ sellerId });
    if (existing) {
      return NextResponse.json(
        { error: "Seller ID already exists. Please use a different ID or login instead." },
        { status: 409 }
      );
    }

    // Create new seller
    const seller = await Seller.create({ sellerId, name, email });

    // Return seller data (excluding sensitive fields if any)
    return NextResponse.json(
      {
        _id: seller._id.toString(),
        sellerId: seller.sellerId,
        name: seller.name,
        email: seller.email,
        createdAt: seller.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: seller.updatedAt?.toISOString() || new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Signup error", err);
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
