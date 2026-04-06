import * as dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// 1. Load Environment Variables IMMEDIATELY
// This must run before we import the database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function resetOrders() {
  try {
    // 2. Check if ENV loaded correctly
    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is missing. Check .env.local");
    }

    console.log("🔌 Loading Database Module...");

    // 3. Dynamic Import (Fixes the "Missing MONGODB_URI" error)
    // We import these HERE so they use the env vars we just loaded above.
    const { connectToDatabase } = await import('../lib/mongoose');
    const { HubSpokeOrder, P2POrder, PersonalizedOrder } = await import('../models/orders');

    console.log("🧹 Connecting to DB to wipe orders...");
    await connectToDatabase();

    // 4. Delete Records
    const p1 = HubSpokeOrder.deleteMany({});
    const p2 = P2POrder.deleteMany({});
    const p3 = PersonalizedOrder.deleteMany({});

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    console.log(`✅ Cleared ${r1.deletedCount} Hub & Spoke Orders`);
    console.log(`✅ Cleared ${r2.deletedCount} P2P Orders`);
    console.log(`✅ Cleared ${r3.deletedCount} Personalized Orders`);
    
    console.log("✨ All order tables are now empty.");

  } catch (error) {
    console.error("❌ Error wiping DB:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(0);
  }
}

resetOrders();