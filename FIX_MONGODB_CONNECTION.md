# Fix MongoDB Connection - Step by Step

## Current Issue
DNS timeout when resolving `_mongodb._tcp.cargovista.fkpkily.mongodb.net`

## Solution Options

### Option 1: Get Standard Connection String (Recommended if DNS keeps failing)

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Log in with your account

2. **Navigate to Your Cluster**
   - Click on your cluster: `cargovista`
   - Click the **"Connect"** button

3. **Get Connection String**
   - Choose **"Connect your application"**
   - Select **"Node.js"** as the driver
   - Copy the connection string

4. **Convert SRV to Standard Format**
   - The SRV format looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
   - You need to get the actual server addresses
   - In Atlas, go to your cluster → **"Connect"** → **"Connect using MongoDB Compass"**
   - This will show you the actual server addresses
   - Format: `mongodb://user:pass@server1:27017,server2:27017/dbname?ssl=true`

5. **Update .env.local**
   ```bash
   MONGODB_URI="mongodb://cargo_vista:cargovista@[server-addresses]/cargovista?ssl=true&authSource=admin"
   ```

### Option 2: Fix DNS Resolution (Try This First)

1. **Check Cluster Status**
   - Go to MongoDB Atlas
   - Ensure cluster is **RUNNING** (not paused)
   - If paused, click **"Resume"**

2. **Check Network Access**
   - Go to **Network Access** in Atlas
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (for development)
   - Or add your specific IP address

3. **Verify Database User**
   - Go to **Database Access**
   - Find user: `cargo_vista`
   - Ensure password is correct: `cargovista`
   - If unsure, reset the password

4. **Test DNS Resolution**
   Run this in terminal:
   ```bash
   nslookup _mongodb._tcp.cargovista.fkpkily.mongodb.net
   ```
   
   If this fails, it's a DNS issue on your network.

### Option 3: Use Alternative DNS

If your network's DNS is blocking MongoDB Atlas, try:

1. **Change DNS Server**
   - Use Google DNS: `8.8.8.8` and `8.8.4.4`
   - Or Cloudflare DNS: `1.1.1.1` and `1.0.0.1`

2. **On macOS:**
   ```bash
   # Check current DNS
   scutil --dns
   
   # Change DNS (requires admin)
   # Go to System Preferences → Network → Advanced → DNS
   ```

### Option 4: Get Direct Connection String from Atlas

1. In MongoDB Atlas, go to your cluster
2. Click **"Connect"** → **"Connect using MongoDB Compass"**
3. Copy the connection string shown
4. It will look like:
   ```
   mongodb://cargo_vista:cargovista@cargovista-shard-00-00.fkpkily.mongodb.net:27017,cargovista-shard-00-01.fkpkily.mongodb.net:27017,cargovista-shard-00-02.fkpkily.mongodb.net:27017/cargovista?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```
5. Replace the connection string in `.env.local`

## Quick Test

After updating `.env.local`, restart your Next.js server and test:
```bash
curl http://localhost:3000/api/test-db
```

## Still Not Working?

1. **Check if cluster exists**: The cluster name might be wrong
2. **Check credentials**: Username/password might be incorrect
3. **Check network**: Try from a different network/VPN
4. **Contact MongoDB Support**: If cluster is definitely running
