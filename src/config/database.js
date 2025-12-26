"use strict";
/* -------------------------------------------------------
    TravelSync - Database Connection (CommonJS)
------------------------------------------------------- */

const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
      minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);

    const logger = require('./logger');
    logger.info('MongoDB connected successfully');

    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    const logger = require('./logger');
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = { mongoose, connectDatabase };