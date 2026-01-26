// Load environment variables from .env.local manually
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const { execSync } = require('child_process');
const { connectToDatabase } = require('../lib/mongoose');
const City = require('../models/City');
const {SystemConfig} = require('../models/SystemConfig');

async function runStep1() {
  try {
    console.log("🛠️  Starting CargoVista Network Initialization...");
    
    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to MongoDB");

    // 1. Run the C++ binary with the --init flag
    // Check if designer binary exists, if not try solver
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
        throw new Error('Neither designer nor solver binary found. Please run: npm run compile:all');
      }
    }
    
    console.log(`⏳ Running ${binaryName} to calculate Clusters, Hubs, and Distance Matrix...`);
    console.log(`Binary path: ${binaryPath}`);
    
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

    console.log("\n✅✅✅ Network Initialization Complete! ✅✅✅");
    console.log("The solver API should now work correctly.");
  } catch (error) {
    console.error("❌ Error during network initialization:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runStep1();