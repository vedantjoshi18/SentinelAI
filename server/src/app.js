const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Request body parsing with size limitation
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const threatRoutes = require('./routes/threatRoutes');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { securityMiddleware } = require('./middleware/securityMiddleware');

// Health check endpoint (exempt from security inspection)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rate limiting on API routes
app.use('/api', apiLimiter);

// SentinelAI Deep Inspection Security Middleware (Rules + AI + Dynamic Risk Engine)
app.use(securityMiddleware);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/threats', threatRoutes);

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
