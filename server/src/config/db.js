const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    await seedDemoUsers();
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // In production, failure to connect to DB is fatal
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
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

module.exports = { connectDB, disconnectDB };