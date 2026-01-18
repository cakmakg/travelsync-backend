"use strict";
/* -------------------------------------------------------
    TravelSync - Error Sanitizer Utility
    Sanitize error messages to prevent information disclosure
    and injection attacks
------------------------------------------------------- */

const logger = require('../config/logger');

/**
 * Sanitize error message for API response
 * Removes sensitive information and prevents injection
 * 
 * @param {Error} error - Error object
 * @param {Boolean} isDevelopment - Development mode flag
 * @returns {Object} - { message: String, sanitized: Boolean, originalMessage: String }
 */
const sanitizeError = (error, isDevelopment = false) => {
  if (!error) {
    return {
      message: 'An unexpected error occurred',
      sanitized: true,
      originalMessage: '',
    };
  }

  const originalMessage = error.message || String(error);
  let sanitizedMessage = originalMessage;
  let shouldSanitize = true;

  // ===== DEVELOPMENT MODE =====
  if (isDevelopment) {
    // In development, allow more detailed errors
    shouldSanitize = false;
    sanitizedMessage = originalMessage;
  } else {
    // ===== PRODUCTION MODE =====
    // Check for sensitive information patterns
    
    // 1. Remove MongoDB connection strings
    sanitizedMessage = sanitizedMessage.replace(
      /mongodb:\/\/[^/]+:[^@]+@[^/]+/gi,
      'mongodb://[REDACTED]'
    );

    // 2. Remove file paths
    sanitizedMessage = sanitizedMessage.replace(
      /([A-Z]:)?\\?([a-zA-Z0-9_\-./]+){2,}/g,
      '[PATH]'
    );

    // 3. Remove IP addresses
    sanitizedMessage = sanitizedMessage.replace(
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      '[IP]'
    );

    // 4. Remove email addresses (partially)
    sanitizedMessage = sanitizedMessage.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[EMAIL]'
    );

    // 5. Remove tokens/hashes (JWT patterns, long hex strings)
    sanitizedMessage = sanitizedMessage.replace(
      /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.?[A-Za-z0-9_-]*/g,
      '[TOKEN]'
    );

    // 6. Remove hex strings > 20 chars (likely hashes/IDs)
    sanitizedMessage = sanitizedMessage.replace(
      /\b[a-f0-9]{20,}\b/gi,
      '[HASH]'
    );

    // 7. Remove SQL patterns
    sanitizedMessage = sanitizedMessage.replace(
      /(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM|HAVING|JOIN|GROUP|ORDER|LIMIT)\s+/gi,
      '[SQL]'
    );

    // 8. Remove environment variable patterns
    sanitizedMessage = sanitizedMessage.replace(
      /\$\{[^}]+\}|process\.env\.[A-Z_]+/gi,
      '[ENV]'
    );

    // 9. Remove specific error stack traces
    if (sanitizedMessage.includes('at ')) {
      sanitizedMessage = sanitizedMessage.split('\n')[0];
    }

    // 10. Truncate excessively long messages
    if (sanitizedMessage.length > 500) {
      sanitizedMessage = sanitizedMessage.substring(0, 500) + '...';
    }
  }

  // ===== GENERIC USER-FRIENDLY MESSAGES =====
  // Map known error types to safe messages
  const safeMessageMap = {
    'ValidationError': 'Validation failed. Please check your input.',
    'CastError': 'Invalid identifier format',
    'MongoServerError': 'Database error occurred',
    'JsonWebTokenError': 'Invalid token. Please login again.',
    'TokenExpiredError': 'Session expired. Please login again.',
    'ReferenceError': 'Internal error occurred',
    'TypeError': 'Invalid data received',
    'SyntaxError': 'Invalid request format',
    'ENOTFOUND': 'Service unavailable',
    'ECONNREFUSED': 'Connection failed',
    'ETIMEDOUT': 'Request timeout',
  };

  // Check if error name matches known types
  if (error.name && safeMessageMap[error.name]) {
    sanitizedMessage = safeMessageMap[error.name];
  }

  // ===== PATTERNS INDICATING INJECTION/ATTACK =====
  const dangerousPatterns = [
    /<script|javascript:|on\w+=|eval\(|alert\(/gi,
    /[';"]?\s*(UNION|SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
    /\$\{.*\}|`.*`/,
  ];

  let isInjectionAttempt = false;
  for (const pattern of dangerousPatterns) {
    if (pattern.test(originalMessage)) {
      isInjectionAttempt = true;
      sanitizedMessage = 'Invalid request';
      logger.warn('[Error Sanitizer] Potential injection attempt detected:', {
        pattern: pattern.toString(),
        originalMessage: originalMessage.substring(0, 100),
      });
      break;
    }
  }

  return {
    message: sanitizedMessage || 'An error occurred',
    sanitized: shouldSanitize || isInjectionAttempt,
    originalMessage: isDevelopment ? originalMessage : '[REDACTED]',
    isInjectionAttempt,
  };
};

/**
 * Create safe error response
 * Logs internal details, returns sanitized response
 * 
 * @param {Error} error - Original error
 * @param {Object} req - Express request for context
 * @param {Boolean} isDevelopment - Development mode
 * @returns {Object} - Safe error response { message, statusCode }
 */
const createSafeErrorResponse = (error, req, isDevelopment = false) => {
  const sanitized = sanitizeError(error, isDevelopment);
  
  // Always log original error internally
  logger.error('[Error Response]', {
    original: sanitized.originalMessage,
    sanitized: sanitized.message,
    isInjection: sanitized.isInjectionAttempt,
    path: req?.originalUrl,
    method: req?.method,
    user: req?.user?.email || 'anonymous',
  });

  return {
    message: sanitized.message,
    statusCode: error.statusCode || 500,
  };
};

/**
 * Sanitize object values (remove sensitive data)
 * @param {Object} obj - Object to sanitize
 * @param {String[]} keysToRedact - Keys to redact
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, keysToRedact = ['password', 'token', 'secret', 'api_key', 'apiKey']) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    // Redact sensitive keys
    if (keysToRedact.some(k => lowerKey.includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
    // Recursively sanitize nested objects
    else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], keysToRedact);
    }
  });

  return sanitized;
};

/**
 * Sanitize log data
 * Removes sensitive information before logging
 * @param {Object} data - Data to log
 * @returns {Object} - Sanitized data
 */
const sanitizeLogData = (data) => {
  return sanitizeObject(data, [
    'password',
    'token',
    'secret',
    'api_key',
    'apiKey',
    'refresh_token',
    'access_token',
    'authorization',
  ]);
};

/**
 * Create validation error response
 * Formats validation errors safely
 * @param {Object} validationErrors - Mongoose validation errors
 * @returns {Array} - Safe error array
 */
const formatValidationErrors = (validationErrors) => {
  if (!validationErrors) return [];

  return Object.entries(validationErrors).map(([field, error]) => {
    // Safely extract error message
    const message = error.message || String(error);
    
    // Sanitize field name (remove technical details)
    const sanitizedField = field.replace(/^.*\./, ''); // Remove nested paths
    
    return {
      field: sanitizedField,
      message: message.substring(0, 100), // Limit message length
    };
  });
};

/**
 * Check if error should be exposed to client
 * @param {Error} error - Error to check
 * @returns {Boolean} - True if safe to expose
 */
const isSafeToExpose = (error) => {
  if (!error) return false;

  // These error types are safe to expose (don't contain sensitive info)
  const safeErrorTypes = [
    'ValidationError',
    'NotFoundError',
    'UnauthorizedError',
    'ForbiddenError',
    'ConflictError',
    'BadRequestError',
  ];

  // Check if error has isOperational flag (custom application error)
  if (error.isOperational && error.statusCode) {
    return true;
  }

  // Check error name
  if (error.name && safeErrorTypes.includes(error.name)) {
    return true;
  }

  return false;
};

module.exports = {
  sanitizeError,
  createSafeErrorResponse,
  sanitizeObject,
  sanitizeLogData,
  formatValidationErrors,
  isSafeToExpose,
};
