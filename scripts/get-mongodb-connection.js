/**
 * Helper script to get MongoDB connection string from Atlas
 * 
 * Instructions:
 * 1. Go to MongoDB Atlas: https://cloud.mongodb.com
 * 2. Click on your cluster → "Connect"
 * 3. Choose "Connect your application"
 * 4. Select "Node.js" driver
 * 5. Copy the connection string
 * 6. Run this script to validate it
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(60));
console.log('MongoDB Connection String Helper');
console.log('='.repeat(60));
console.log('\nTo get your connection string:');
console.log('1. Go to https://cloud.mongodb.com');
console.log('2. Click on your cluster → "Connect"');
console.log('3. Choose "Connect your application"');
console.log('4. Select "Node.js" driver');
console.log('5. Copy the connection string\n');

rl.question('Paste your MongoDB connection string here: ', (connectionString) => {
  console.log('\n' + '='.repeat(60));
  console.log('Connection String Analysis:');
  console.log('='.repeat(60));
  
  // Validate format
  if (!connectionString.includes('mongodb')) {
    console.error('❌ Invalid connection string format');
    process.exit(1);
  }
  
  // Check if it's SRV format
  const isSrv = connectionString.startsWith('mongodb+srv://');
  console.log(`Format: ${isSrv ? 'SRV (mongodb+srv://)' : 'Standard (mongodb://)'}`);
  
  // Extract components
  try {
    const url = new URL(connectionString);
    const username = url.username || 'NOT SET';
    const hostname = url.hostname || 'NOT SET';
    const pathname = url.pathname || '/';
    const database = pathname.replace('/', '') || 'NOT SET';
    
    console.log(`Username: ${username}`);
    console.log(`Hostname: ${hostname}`);
    console.log(`Database: ${database}`);
    
    // Check for common issues
    console.log('\n' + '='.repeat(60));
    console.log('Validation:');
    console.log('='.repeat(60));
    
    if (isSrv && hostname.includes('mongodb.net')) {
      console.log('✅ SRV format detected (standard for Atlas)');
      console.log('⚠️  If you\'re getting DNS errors, try:');
      console.log('   1. Check if cluster is running in Atlas');
      console.log('   2. Check IP whitelist in Network Access');
      console.log('   3. Try getting standard connection string from "Connect using MongoDB Compass"');
    }
    
    if (!username || username === 'NOT SET') {
      console.log('❌ Username is missing');
    } else {
      console.log('✅ Username is set');
    }
    
    if (!database || database === 'NOT SET') {
      console.log('⚠️  Database name might be missing');
    } else {
      console.log(`✅ Database: ${database}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Next Steps:');
    console.log('='.repeat(60));
    console.log('1. Copy this connection string');
    console.log('2. Update your .env.local file:');
    console.log(`   MONGODB_URI="${connectionString}"`);
    console.log('3. Restart your Next.js server');
    console.log('4. Test: curl http://localhost:3000/api/test-db');
    
  } catch (error) {
    console.error('❌ Error parsing connection string:', error.message);
    console.log('\nMake sure the connection string is complete and properly formatted.');
  }
  
  rl.close();
});
