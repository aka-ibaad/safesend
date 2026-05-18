require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']); // Temporarily disable manual DNS

const uri = process.env.MONGO_URI;

console.log('Attempting to connect to MongoDB...');
mongoose.connect(uri)
  .then(() => {
    console.log('✅ Success! Connected to MongoDB.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection Failed:', err.name);
    console.error('Error Message:', err.message);
    if (err.reason) console.error('Reason:', err.reason);
    process.exit(1);
  });
