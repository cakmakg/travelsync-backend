"use strict";

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { connectDatabase } = require('./config/database');

dotenv.config();
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
connectDatabase();

// Security & performance middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach response methods to res object (res.success(), res.error(), etc.)
const { attachResponseMethods } = require('./utils/response');
app.use(attachResponseMethods);

// Logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TravelSync API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
const apiRouter = express.Router();

apiRouter.use('/auth', require('./routes/auth'));
apiRouter.use('/organizations', require('./routes/organization'));
apiRouter.use('/users', require('./routes/user'));
apiRouter.use('/properties', require('./routes/property'));
apiRouter.use('/room-types', require('./routes/roomType'));
apiRouter.use('/rate-plans', require('./routes/ratePlan'));
apiRouter.use('/prices', require('./routes/price'));
apiRouter.use('/inventory', require('./routes/inventory'));
apiRouter.use('/reservations', require('./routes/reservation'));
apiRouter.use('/agencies', require('./routes/agency'));
apiRouter.use('/agency-contracts', require('./routes/agencyContract'));

// AI Routes
apiRouter.use('/ai/pricing', require('./routes/ai/pricing.routes'));
apiRouter.use('/analytics', require('./routes/analytics'));

// B2C Routes (Skeleton - Ready for future implementation)
// TODO: Uncomment when implementing B2C module
// apiRouter.use('/travelers', require('./routes/traveler'));
// apiRouter.use('/trips', require('./routes/trip'));
// apiRouter.use('/reviews', require('./routes/review'));

app.use('/api/v1', apiRouter);

// 404 handler
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info('TravelSync API Server');
  logger.info(`Port: ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Time: ${new Date().toLocaleString()}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received. Closing server...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;