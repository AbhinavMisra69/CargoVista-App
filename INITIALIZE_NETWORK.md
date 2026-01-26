# Initialize Network Data

The solver API needs network data (distance matrix, clusters, hubs) to be initialized in the database.

## Option 1: Use API Route (Recommended)

Since your Next.js server can connect to MongoDB, use this API route:

1. **Make sure the C++ binaries are compiled:**
   ```bash
   npm run compile:all
   ```

2. **Call the initialization API:**
   ```bash
   curl -X POST http://localhost:3000/api/init-network
   ```
   
   Or visit in browser: `http://localhost:3000/api/init-network` (but POST is required)

3. **Or use the test button in your app** (if you add one)

## Option 2: Whitelist Your IP and Run Script

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Go to **Network Access**
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (for development)
   - Or add your current IP address

2. **Run the initialization script:**
   ```bash
   npm run init-network
   ```

## Option 3: Manual Initialization (If C++ binary fails)

If the C++ binary doesn't work, you can manually create minimal network data. Contact me for help with this.

## Verify It Worked

After initialization, test the solver:
1. Submit a form with orders
2. The solver should now work instead of showing "Network not initialized"

Or check the database:
- SystemConfig collection should have a document with `key: "network_data"`
- City collection should have city data
