"use strict";
/* -------------------------------------------------------
    TravelSync - Error Handler Middleware
    Centralized error handling for all API endpoints
------------------------------------------------------- */

const { error } = require('../utils/response');

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
  // Log error
  console.error('[Error Handler]', {
    message: err.message,
    stack: err.stack,
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
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
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

  // Prevent unused param lint error
  void _next;

  // Send error response
  return error(res, message, statusCode, details);
};

/**
 * 404 Not Found handler
 * Must be used after all routes
 */
const notFoundHandler = (req, res) => {
  return res.notFound(`Route ${req.method} ${req.originalUrl} not found`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

