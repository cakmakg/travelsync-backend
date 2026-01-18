"use strict";
/* -------------------------------------------------------
    TravelSync - Token Blacklist Cleanup Script
    Removes expired entries from blacklist
    
    Run via cron job or manually:
    node server/scripts/cleanupBlacklist.js
------------------------------------------------------- */

const dotenv = require('dotenv');
dotenv.config();

const { connectDatabase } = require('../config/database');
const logger = require('../config/logger');
const tokenService = require('../services/token.service');

const cleanup = async () => {
  try {
    logger.info('Starting token blacklist cleanup...');
    
    // Connect to database
    await connectDatabase();
    
    // Run cleanup
    const result = await tokenService.cleanupExpiredBlacklist();
    
    logger.info(`✅ Cleanup completed - Deleted ${result.deletedCount} expired entries`);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

cleanup();
