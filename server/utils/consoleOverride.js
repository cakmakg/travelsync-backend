"use strict";
/* -------------------------------------------------------
    TravelSync - Console Override Module
    Redirects console output to logger in production
    
    Import this at the very start of app.js:
    require('./utils/consoleOverride');
------------------------------------------------------- */

const logger = require('../config/logger');

/**
 * Override console methods to route through Winston logger
 * Only effective in production (controlled by logger.js)
 * 
 * This module should be required at application startup
 * BEFORE any other modules that might use console
 */

// Store original console methods for debugging if needed
global._originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

// Override based on environment
if (process.env.NODE_ENV === 'production') {
  // Suppress console.log and console.debug completely in production
  console.log = function() {};
  console.debug = function() {};
  
  // Route console.info, warn, error to logger
  console.info = function(...args) {
    logger.info(args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
  };
  
  console.warn = function(...args) {
    logger.warn(args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
  };
  
  console.error = function(...args) {
    logger.error(args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
  };
}

module.exports = {
  restoreConsole: () => {
    // For testing purposes - restore original console
    console.log = global._originalConsole.log;
    console.warn = global._originalConsole.warn;
    console.error = global._originalConsole.error;
    console.info = global._originalConsole.info;
    console.debug = global._originalConsole.debug;
  },
};
