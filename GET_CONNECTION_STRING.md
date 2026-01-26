# How to Get Standard Connection String from MongoDB Compass/Atlas

## Method 1: From MongoDB Atlas (Easiest)

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Log in

2. **Navigate to Your Cluster**
   - Click on your cluster: `cargovista`
   - Click the **"Connect"** button

3. **Get Standard Connection String**
   - Choose **"Connect using MongoDB Compass"**
   - You'll see a connection string that looks like:
     ```
     mongodb://cargo_vista:cargovista@cargovista-shard-00-00.fkpkily.mongodb.net:27017,cargovista-shard-00-01.fkpkily.mongodb.net:27017,cargovista-shard-00-02.fkpkily.mongodb.net:27017/cargovista?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
     ```
   - **Copy this entire string**

4. **Update .env.local**
   - Open `.env.local` in your project
   - Replace the `MONGODB_URI` line with:
     ```
     MONGODB_URI="[paste the connection string here]"
     ```
   - Make sure to keep the quotes around it

## Method 2: From MongoDB Compass

1. **Open MongoDB Compass**
2. **Look at the connection string in the address bar**
   - It will show the connection string you used
   - Copy it

3. **If you don't see it:**
   - Click the connection name in Compass
   - Go to connection settings
   - The connection string should be visible there

## Method 3: Construct It Manually

If you know your cluster details, you can construct it:

Format:
```
mongodb://[username]:[password]@[host1]:[port1],[host2]:[port2],[host3]:[port3]/[database]?ssl=true&replicaSet=[replica-set-name]&authSource=admin&retryWrites=true&w=majority
```

For your case, it should be something like:
```
mongodb://cargo_vista:cargovista@cargovista-shard-00-00.fkpkily.mongodb.net:27017,cargovista-shard-00-01.fkpkily.mongodb.net:27017,cargovista-shard-00-02.fkpkily.mongodb.net:27017/cargovista?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

## After Updating

1. **Restart your Next.js server** (stop and start again)
2. **Test the connection:**
   ```bash
   curl http://localhost:3000/api/test-db
   ```
   Or visit: http://localhost:3000/api/test-db in your browser

3. **Try submitting the form again**
