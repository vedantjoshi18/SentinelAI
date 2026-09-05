const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from root or local .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local server/.env if present

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinelai',
  JWT_SECRET: process.env.JWT_SECRET || 'sentinelai_dev_fallback_secret_change_in_production!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  AI_SERVICE_TIMEOUT_MS: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 3000,
};
