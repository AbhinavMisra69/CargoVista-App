import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing `MONGODB_URI` environment variable.");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase(retries = 2) {
  if (cached.conn) {
    // Check if connection is still alive
    if (cached.conn.connection.readyState === 1) {
      console.log("[MongoDB] Using cached connection");
      return cached.conn;
    } else {
      console.log("[MongoDB] Cached connection is dead, creating new one");
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    console.log("[MongoDB] Creating new connection...");
    const uriPreview = MONGODB_URI?.substring(0, 30) + "...";
    console.log("[MongoDB] URI format:", uriPreview);
    const isSrv = MONGODB_URI?.startsWith("mongodb+srv://");
    console.log("[MongoDB] Is SRV format:", isSrv);
    
    if (isSrv) {
      console.log("[MongoDB] Using SRV format - DNS resolution required");
      console.log("[MongoDB] If this fails, try getting standard connection string from Atlas");
    }
    
    const connectionOptions: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    };
    
    // For SRV connections, don't force IPv4 as it might cause issues
    if (!isSrv) {
      connectionOptions.family = 4; // Force IPv4 for standard connections
    }
    
    cached.promise = mongoose.connect(MONGODB_URI!, connectionOptions).then((conn) => {
      console.log("[MongoDB] Connected successfully to:", conn.connection.db?.databaseName || "unknown");
      return conn;
    }).catch((err) => {
      console.error("[MongoDB] Connection error:", err);
      console.error("[MongoDB] Error code:", (err as any)?.code);
      console.error("[MongoDB] Error message:", err instanceof Error ? err.message : String(err));
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    const errorCode = (err as any)?.code;
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    console.error("[MongoDB] Failed to establish connection");
    console.error("[MongoDB] Error code:", errorCode);
    console.error("[MongoDB] Error message:", errorMessage);
    
    // If it's a timeout and we have retries left, try again
    if ((errorCode === 'ETIMEOUT' || errorMessage.includes('ETIMEOUT')) && retries > 0) {
      console.log(`[MongoDB] Retrying connection (${retries} retries left)...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return connectToDatabase(retries - 1);
    }
    
    // Provide helpful error message
    if (errorCode === 'ETIMEOUT' || errorMessage.includes('ETIMEOUT')) {
      const isSrv = MONGODB_URI?.startsWith("mongodb+srv://");
      let helpMessage = `MongoDB connection timeout (DNS resolution failed).\n\n`;
      
      if (isSrv) {
        helpMessage += `You're using SRV format (mongodb+srv://) which requires DNS resolution.\n`;
        helpMessage += `To fix this:\n`;
        helpMessage += `1. Go to MongoDB Atlas → Your Cluster → "Connect" → "Connect using MongoDB Compass"\n`;
        helpMessage += `2. Copy the standard connection string (mongodb://...)\n`;
        helpMessage += `3. Update .env.local with the standard format\n`;
        helpMessage += `4. Or check: Network Access in Atlas (IP whitelist)\n`;
        helpMessage += `5. Or check: Cluster status (make sure it's running, not paused)\n`;
      } else {
        helpMessage += `Possible causes:\n`;
        helpMessage += `1. MongoDB Atlas cluster might be paused or deleted\n`;
        helpMessage += `2. Your IP address is not whitelisted in MongoDB Atlas\n`;
        helpMessage += `3. Network/firewall blocking the connection\n`;
        helpMessage += `4. Incorrect connection string\n`;
      }
      
      helpMessage += `\nSee FIX_MONGODB_CONNECTION.md for detailed instructions.`;
      
      throw new Error(helpMessage);
    }
    
    throw err;
  }
}

