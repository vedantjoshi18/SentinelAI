const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { validateSecurityConfig } = require('./config/securityValidator');

const PORT = env.PORT;

// Enforce production security hygiene and cryptographic secret entropy standards
const securityAudit = validateSecurityConfig(env);
if (!securityAudit.valid) {
  console.error('[SentinelAI-Security] CRITICAL PRE-FLIGHT FAILURE:');
  securityAudit.issues.forEach((issue) => console.error(`  - ${issue}`));
  if (env.NODE_ENV === 'production') {
    console.error('[SentinelAI-Security] Server startup aborted due to critical security misconfiguration.');
    process.exit(1);
  }
} else if (securityAudit.issues.length > 0) {
  securityAudit.issues.forEach((issue) => console.warn(`[SentinelAI-Security] ${issue}`));
}

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
