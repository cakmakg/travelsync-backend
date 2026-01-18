"use strict";
/**
 * TravelSync - Server Entry Point
 * Handles database connection and server startup
 */

// Override console in production FIRST (before any other requires)
require('./utils/consoleOverride');

const dotenv = require('dotenv');
dotenv.config();

const { connectDatabase } = require('./config/database');
const logger = require('./config/logger');
const app = require('./app');

const PORT = process.env.PORT || 8000;

// Database connection
connectDatabase();

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
