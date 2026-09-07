const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    hsts:
      env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

const { sanitizationMiddleware } = require('./middleware/sanitizationMiddleware');

// Request body parsing with size limitation
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizationMiddleware);

// Request logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const threatRoutes = require('./routes/threatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { getIsConnected, getIsInMemory } = require('./config/db');
const { aiClient } = require('./services/aiClient');
const { securityMiddleware } = require('./middleware/securityMiddleware');

// Health check endpoint (exempt from security inspection)
app.get('/api/health', async (req, res) => {
  if (process.env.NODE_ENV === 'test') {
    return res.status(200).json({ status: 'ok' });
  }

  const aiHealth = await aiClient.checkHealth();
  res.status(200).json({
    status: 'ok',
    database: getIsInMemory() ? 'in-memory' : (getIsConnected() ? 'connected' : 'disconnected'),
    aiService: aiHealth,
  });
});

// Rate limiting on API routes
app.use('/api', apiLimiter);

// SentinelAI Deep Inspection Security Middleware (Rules + AI + Dynamic Risk Engine)
app.use(securityMiddleware);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

module.exports = app;
