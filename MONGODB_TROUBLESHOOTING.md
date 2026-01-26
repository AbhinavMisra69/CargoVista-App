# MongoDB Connection Troubleshooting

## Current Error
`ETIMEOUT _mongodb._tcp.cargovista.fkpkily.mongodb.net`

This is a DNS resolution timeout when trying to connect to MongoDB Atlas.

## Quick Fixes

### 1. Check MongoDB Atlas Cluster Status
- Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
- Verify your cluster `cargovista` is running (not paused)
- Check if the cluster exists and is accessible

### 2. Check IP Whitelist
- In MongoDB Atlas, go to **Network Access**
- Make sure your current IP address is whitelisted
- Or add `0.0.0.0/0` to allow all IPs (for development only)

### 3. Verify Connection String
Your current connection string format:
```
mongodb+srv://cargo_vista:cargovista@cargovista.fkpkily.mongodb.net/cargovista
```

Make sure:
- Username: `cargo_vista` is correct
- Password: `cargovista` is correct
- Cluster name: `cargovista.fkpkily.mongodb.net` matches your Atlas cluster
- Database name: `cargovista` is correct

### 4. Test Connection
Visit: `http://localhost:3000/api/test-db` to test the connection

### 5. Alternative: Use Standard Connection String
If SRV format continues to fail, you can try the standard format:
1. In MongoDB Atlas, click **Connect** on your cluster
2. Choose **Connect your application**
3. Select **Node.js** driver
4. Copy the connection string
5. Replace `mongodb+srv://` with `mongodb://` (if DNS issues persist)

### 6. Check Network/Firewall
- Ensure your network allows outbound connections to MongoDB Atlas
- Check if a VPN or firewall is blocking the connection
- Try from a different network to isolate the issue

### 7. Verify Database User
- In MongoDB Atlas, go to **Database Access**
- Ensure user `cargo_vista` exists and has proper permissions
- Reset the password if needed

## Testing the Connection

Run this in your terminal:
```bash
curl http://localhost:3000/api/test-db
```

Or visit the URL in your browser to see detailed connection information.
