"use strict";
/* -------------------------------------------------------
    TravelSync - Response Helper
    Standardized response formatting for all API endpoints
------------------------------------------------------- */

/**
 * Standardized success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object} options - Additional options (message, pagination, meta)
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const success = (res, data = null, options = {}, statusCode = 200) => {
  const response = {
    success: true,
  };

  if (data !== null) {
    response.data = data;
  }

  if (options.message) {
    response.message = options.message;
  }

  if (options.pagination) {
    response.pagination = options.pagination;
  }

  if (options.meta) {
    response.meta = options.meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standardized error response
 * @param {Object} res - Express response object
 * @param {String|Object} error - Error message or error object
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 */
const error = (res, error, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message: typeof error === 'string' ? error : error.message || 'Internal Server Error',
    },
  };

  if (details) {
    response.error.details = details;
  }

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.error.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 */
const created = (res, data, message = null) => {
  return success(res, data, { message }, 201);
};

/**
 * Bad Request response (400)
 */
const badRequest = (res, message, details = null) => {
  return error(res, message, 400, details);
};

/**
 * Unauthorized response (401)
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

/**
 * Forbidden response (403)
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

/**
 * Not Found response (404)
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * Conflict response (409)
 */
const conflict = (res, message = 'Resource already exists') => {
  return error(res, message, 409);
};

/**
 * Validation Error response (400)
 */
const validationError = (res, message, details = null) => {
  return error(res, message, 400, details);
};

/**
 * Attach response methods to Express response object
 * This allows using res.success(), res.error(), etc.
 */
const attachResponseMethods = (req, res, next) => {
  res.success = (data, options, statusCode) => success(res, data, options, statusCode);
  res.error = (error, statusCode, details) => error(res, error, statusCode, details);
  res.created = (data, message) => created(res, data, message);
  res.badRequest = (message, details) => badRequest(res, message, details);
  res.unauthorized = (message) => unauthorized(res, message);
  res.forbidden = (message) => forbidden(res, message);
  res.notFound = (message) => notFound(res, message);
  res.conflict = (message) => conflict(res, message);
  res.validationError = (message, details) => validationError(res, message, details);
  next();
};

module.exports = {
  success,
  error,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  attachResponseMethods,
};

