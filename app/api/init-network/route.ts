import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { connectToDatabase } from "@/lib/mongoose";
import City from "@/models/City";
import { SystemConfig } from "@/models/SystemConfig";
import path from "path";
import fs from "fs";

export async function POST() {
  try {
    console.log("🛠️  Starting CargoVista Network Initialization via API...");
    
    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to MongoDB");

    // 1. Run the C++ binary with the --init flag
    const designerPath = path.resolve(process.cwd(), 'solver/bin/designer');
    const solverPath = path.resolve(process.cwd(), 'solver/bin/solver');
    
    let binaryPath: string;
    let binaryName: string;
    
    try {
      // Try to use designer first (as per package.json)
      fs.accessSync(designerPath);
      binaryPath = designerPath;
      binaryName = 'designer';
    } catch {
      // Fallback to solver if designer doesn't exist
      try {
        fs.accessSync(solverPath);
        binaryPath = solverPath;
        binaryName = 'solver';
      } catch {
        return NextResponse.json(
          { error: 'Neither designer nor solver binary found. Please run: npm run compile:all' },
          { status: 500 }
        );
      }
    }
    
    console.log(`⏳ Running ${binaryName} to calculate Clusters, Hubs, and Distance Matrix...`);
    
    // This captures the 'cout' from C++
    const rawOutput = execSync(`${binaryPath} --init`, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    console.log("Raw output length:", rawOutput.length);
    const data = JSON.parse(rawOutput);
    console.log("✅ Parsed JSON data successfully");

    // 2. Clear old data from MongoDB
    console.log("🗑️  Clearing old network data...");
    await City.deleteMany({});
    await SystemConfig.deleteMany({});
    console.log("✅ Old data cleared");

    // 3. Save the cities (with coordinates)
    if (data.cities && Array.isArray(data.cities)) {
      console.log(`💾 Saving ${data.cities.length} cities...`);
      await City.insertMany(data.cities);
      console.log("✅ Cities saved");
    } else {
      console.warn("⚠️  No cities data found in output");
    }

    // 4. Save the "Network Memory" (Matrix + Clusters + Hubs)
    console.log("💾 Saving network data (distance matrix, clusters, hubs)...");
    const networkData: any = {
      key: 'network_data',
      distMatrix: data.distMatrix,
      hubs: data.hubs || []
    };
    
    // Add clusters if they exist
    if (data.clusters) {
      networkData.clusters = data.clusters;
    }
    
    // Add spokeToHub if it exists (for backward compatibility)
    if (data.spokeToHub) {
      networkData.spokeToHub = data.spokeToHub;
    }
    
    await SystemConfig.create(networkData);
    console.log("✅ Network data saved");

    return NextResponse.json({
      success: true,
      message: "Network initialization complete!",
      citiesCount: data.cities?.length || 0,
      hasDistMatrix: !!data.distMatrix,
      hasHubs: !!data.hubs,
      hasClusters: !!data.clusters,
    });
  } catch (error: unknown) {
    console.error("❌ Error during network initialization:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        success: false,
        error: "Network initialization failed",
        details: message 
      },
      { status: 500 }
    );
  }
}
