import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";

export async function GET() {
  try {
    const hasUri = !!process.env.MONGODB_URI;
    const uriPreview = process.env.MONGODB_URI 
      ? process.env.MONGODB_URI.substring(0, 30) + "..." 
      : "NOT SET";
    const uriMasked = process.env.MONGODB_URI?.replace(/:[^:@]+@/, ":****@");
    
    console.log("[Test DB] MONGODB_URI exists:", hasUri);
    console.log("[Test DB] MONGODB_URI (masked):", uriMasked);
    
    if (!hasUri) {
      return NextResponse.json({
        success: false,
        error: "MONGODB_URI environment variable is not set",
        instructions: "Please set MONGODB_URI in your .env.local file",
      }, { status: 500 });
    }

    // Check URI format
    const isSrv = process.env.MONGODB_URI?.startsWith("mongodb+srv://");
    const uriInfo = {
      isSrvFormat: isSrv,
      hasProtocol: process.env.MONGODB_URI?.includes("://"),
      length: process.env.MONGODB_URI?.length || 0,
    };
    
    console.log("[Test DB] URI info:", uriInfo);
    
    const conn = await connectToDatabase();
    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
      dbName: conn.connection.db?.databaseName || "unknown",
      readyState: conn.connection.readyState,
      uriInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    const code = (err as any)?.code;
    
    console.error("[Test DB] MongoDB connection error:", err);
    
    let helpfulMessage = message;
    let suggestions: string[] = [];
    
    if (code === 'ETIMEOUT' || message.includes('ETIMEOUT')) {
      helpfulMessage = "MongoDB connection timeout - DNS resolution failed";
      suggestions = [
        "Check your internet connection",
        "Verify your MongoDB Atlas cluster is running",
        "Check if your IP address is whitelisted in MongoDB Atlas",
        "Try using the standard connection string format (mongodb://) instead of SRV (mongodb+srv://)",
        "Verify the connection string format in .env.local",
      ];
    } else if (code === 'ENOTFOUND' || message.includes('ENOTFOUND')) {
      helpfulMessage = "MongoDB hostname not found";
      suggestions = [
        "Verify the MongoDB URI is correct",
        "Check if the cluster name in the URI matches your Atlas cluster",
      ];
    } else if (message.includes('authentication')) {
      helpfulMessage = "MongoDB authentication failed";
      suggestions = [
        "Verify your username and password in the connection string",
        "Check if the database user has proper permissions",
      ];
    }
    
    return NextResponse.json(
      {
        success: false,
        error: helpfulMessage,
        code,
        suggestions,
        stack: process.env.NODE_ENV === "development" ? stack : undefined,
      },
      { status: 500 }
    );
  }
}
