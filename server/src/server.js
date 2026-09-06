const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

const PORT = env.PORT;

// Connect to MongoDB and start server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[SentinelAI-Server] Running on port ${PORT} in ${env.NODE_ENV} mode`);
    console.log(`[SentinelAI-Server] Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SentinelAI-Server] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('[SentinelAI-Server] Process terminated.');
    });
  });
});
