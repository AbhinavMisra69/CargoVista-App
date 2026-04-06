import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongoose';
import { HubSpokeOrder, P2POrder, PersonalizedOrder } from '../models/orders';

async function clearOrders() {
  try {
    console.log("🗑️  Starting Order Cleanup...");
    
    await connectToDatabase();
    console.log("✅ Connected to Database");

    // 1. Clear Hub & Spoke Orders
    const hs = await HubSpokeOrder.deleteMany({});
    console.log(`- Deleted ${hs.deletedCount} Hub & Spoke orders`);

    // 2. Clear P2P Orders
    const p2p = await P2POrder.deleteMany({});
    console.log(`- Deleted ${p2p.deletedCount} P2P orders`);

    // 3. Clear Personalized Orders
    const pers = await PersonalizedOrder.deleteMany({});
    console.log(`- Deleted ${pers.deletedCount} Personalized orders`);

    console.log("✨ All order tables cleared successfully!");

  } catch (error) {
    console.error("❌ Error clearing orders:", error);
  } finally {
    // Close connection to allow script to exit
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(0);
  }
}

clearOrders();