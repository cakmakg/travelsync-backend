"use strict";
/* -------------------------------------------------------
    TravelSync - Error Handler Middleware
    Centralized error handling for all API endpoints
------------------------------------------------------- */

const { error } = require('../utils/response');
const logger = require('../config/logger');
const { sanitizeError, formatValidationErrors, isSafeToExpose } = require('../utils/errorSanitizer');

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Centralized error handler middleware
 * Must be used as the last middleware in Express app
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, _next) => {
  // Log full error internally (suppressed in production via logger config)
  logger.error('[Error Handler] Full error details:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.email || 'anonymous',
  });

  // Default error
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = formatValidationErrors(err.errors);
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  // Custom application errors
  if (err.isOperational) {
    statusCode = err.statusCode || 400;
    message = err.message;
    details = err.details || null;
  }

  // ===== SANITIZE ERROR MESSAGE =====
  // Check if error is safe to expose as-is
  if (!isSafeToExpose(err)) {
    const sanitized = sanitizeError(err, isDevelopment);
    message = sanitized.message;
    
    if (sanitized.isInjectionAttempt) {
      statusCode = 400;
      logger.warn('[Error Handler] Injection attack detected:', {
        original: sanitized.originalMessage.substring(0, 100),
        path: req.originalUrl,
        user: req.user?.email,
      });
    }
  }

  // Prevent unused param lint error
  void _next;

  // Send sanitized error response
  return error(res, message, statusCode, details);
};

/**
 * 404 Not Found handler
 * Must be used after all routes
 */
const notFoundHandler = (req, res) => {
  logger.warn('[404 Not Found]', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  
  return res.notFound(`Route not found`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

