import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Seller } from "@/models/Seller";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { sellerId, password } = body ?? {};

    if (typeof sellerId !== "number") {
      return NextResponse.json(
        { error: "sellerId (number) is required" },
        { status: 400 }
      );
    }

    // Find seller by sellerId
    const seller = await Seller.findOne({ sellerId }).lean();
    
    if (!seller) {
      return NextResponse.json(
        { error: "Invalid seller ID" },
        { status: 401 }
      );
    }

    // For now, we'll allow login without password check
    // You can add password hashing/verification later if needed
    // if (password && seller.password !== hashPassword(password)) {
    //   return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    // }

    // Return seller data (excluding sensitive fields if any)
    return NextResponse.json({
      _id: seller._id.toString(),
      sellerId: seller.sellerId,
      name: seller.name,
      email: seller.email,
      createdAt: seller.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: seller.updatedAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Login error", err);
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
