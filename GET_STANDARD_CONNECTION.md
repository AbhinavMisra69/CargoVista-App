# Get Standard Connection String (Not SRV)

## Current Issue
You're using `mongodb+srv://` which requires DNS resolution and is timing out.

## Solution: Get Standard Format from MongoDB Compass

Since you're already connected in Compass, here's how to get the standard connection string:

### Method 1: From Compass Connection String
1. **In MongoDB Compass**, look at the connection string in the address bar
2. It should show something like:
   ```
   mongodb://cargo_vista:****@cargovista-shard-00-00.fkpkily.mongodb.net:27017,...
   ```
3. Copy that entire string

### Method 2: From Atlas Dashboard
1. Go to https://cloud.mongodb.com
2. Click your cluster → **"Connect"**
3. Choose **"Connect using MongoDB Compass"** (NOT "Connect your application")
4. You'll see a connection string starting with `mongodb://` (NOT `mongodb+srv://`)
5. Copy the ENTIRE string

### Method 3: Construct It (If Above Don't Work)
Based on your cluster `cargovista.fkpkily.mongodb.net`, try:

```
mongodb://cargo_vista:cargovista@cargovista-shard-00-00.fkpkily.mongodb.net:27017,cargovista-shard-00-01.fkpkily.mongodb.net:27017,cargovista-shard-00-02.fkpkily.mongodb.net:27017/cargovista?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

**You need to replace `atlas-xxxxx-shard-0` with your actual replica set name.**

To find your replica set name:
1. In MongoDB Compass, connect to your database
2. Run this command in the MongoDB shell:
   ```javascript
   rs.status()
   ```
3. Look for `"set"` field - that's your replica set name

## What to Look For
- ✅ Starts with `mongodb://` (NOT `mongodb+srv://`)
- ✅ Has actual server addresses like `cargovista-shard-00-00.fkpkily.mongodb.net:27017`
- ✅ Has `replicaSet=` parameter
- ✅ Has `ssl=true` parameter
- ✅ Is 200+ characters long

## After Getting It
1. Update `.env.local` with the standard format
2. Restart your Next.js server
3. Test: `curl http://localhost:3000/api/test-db`
