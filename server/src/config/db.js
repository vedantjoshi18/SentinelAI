const mongoose = require('mongoose');
const env = require('./env');
const { setupInMemoryDb, seedDemoData } = require('./inMemoryDb');

let isConnected = false;
let isInMemory = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    isInMemory = false;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    await seedDemoUsers();
  } catch (error) {
    console.warn(`[MongoDB] Local connection to ${env.MONGODB_URI} failed: ${error.message}`);
    // In production, failure to connect to DB is fatal
    if (env.NODE_ENV === 'production') {
      console.error('[MongoDB] Fatal: Production environment requires persistent MongoDB connection.');
      process.exit(1);
    }
    console.log('[MongoDB] Initializing automated in-memory storage engine for development environment...');
    setupInMemoryDb();
    isConnected = true;
    isInMemory = true;
    await seedDemoData();
    console.log('[MongoDB] In-memory database online. Pre-seeded demo accounts and security events are active.');
  }
};

const seedDemoUsers = async () => {
  try {
    const User = require('../models/User');
    const demoUsers = [
      {
        name: 'Demo Super Admin',
        email: 'demo.admin@sentinelai.local',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      },
      {
        name: 'Demo SOC Analyst',
        email: 'demo.analyst@sentinelai.local',
        password: 'AnalystPassword123!',
        role: 'ANALYST',
      },
    ];

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email });
      if (!existing) {
        const passwordHash = await User.hashPassword(demo.password);
        await User.create({
          name: demo.name,
          email: demo.email,
          passwordHash,
          role: demo.role,
          status: 'active',
        });
        console.log(`[MongoDB] Seeded demo user: ${demo.email} (${demo.role})`);
      }
    }
  } catch (seedErr) {
    console.warn(`[MongoDB] Demo seed warning: ${seedErr.message}`);
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected.');
};

module.exports = {
  connectDB,
  disconnectDB,
  getIsConnected: () => isConnected,
  getIsInMemory: () => isInMemory,
};