# Get Your Actual MongoDB Connection String

## The Problem
Your `.env.local` currently has a placeholder `[server-addresses]` which needs to be replaced with actual MongoDB server addresses.

## Solution: Get Connection String from MongoDB Atlas

### Step 1: Go to MongoDB Atlas
1. Visit: https://cloud.mongodb.com
2. Log in to your account

### Step 2: Get the Connection String
1. Click on your cluster: **cargovista**
2. Click the **"Connect"** button (top right)
3. Choose **"Connect using MongoDB Compass"**
4. You'll see a connection string that looks like this:

```
mongodb://cargo_vista:cargovista@cargovista-shard-00-00.fkpkily.mongodb.net:27017,cargovista-shard-00-01.fkpkily.mongodb.net:27017,cargovista-shard-00-02.fkpkily.mongodb.net:27017/cargovista?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

### Step 3: Copy the ENTIRE String
- Copy everything from `mongodb://` to the end
- It should be quite long (200+ characters)

### Step 4: Update .env.local
Replace the current line with the actual connection string you copied.

## Alternative: If You Can't Find It in Atlas

If you're already connected in Compass, you can:

1. **In MongoDB Compass:**
   - Look at the connection string in the address bar at the top
   - Or click on your connection → "Edit" → view the connection string

2. **Or construct it manually:**
   Based on your cluster name `cargovista.fkpkily.mongodb.net`, try this format:

```
mongodb://cargo_vista:cargovista@cargovista-shard-00-00.fkpkily.mongodb.net:27017,cargovista-shard-00-01.fkpkily.mongodb.net:27017,cargovista-shard-00-02.fkpkily.mongodb.net:27017/cargovista?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

**BUT** you need to replace `atlas-xxxxx-shard-0` with your actual replica set name from Atlas.

## Quick Test
After updating, restart your server and test:
```bash
curl http://localhost:3000/api/test-db
```
