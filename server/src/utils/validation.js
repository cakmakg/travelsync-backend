"use strict";
/* -------------------------------------------------------
    TravelSync - Validation Helper
    Common validation functions
------------------------------------------------------- */

const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 * @param {String} id - ID to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date format
 * @param {String|Date} date - Date to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidDateRange = (startDate, endDate) => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  return new Date(startDate) < new Date(endDate);
};

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {String[]} fields - Required fields
 * @returns {Object} - { valid: Boolean, missing: String[] }
 */
const validateRequired = (data, fields) => {
  const missing = fields.filter((field) => !data[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Validate number range
 * @param {Number} value - Value to validate
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidNumberRange = (value, min, max) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  return value >= min && value <= max;
};

/**
 * Validate string length
 * @param {String} str - String to validate
 * @param {Number} min - Minimum length
 * @param {Number} max - Maximum length
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidStringLength = (str, min, max) => {
  if (typeof str !== 'string') {
    return false;
  }
  return str.length >= min && str.length <= max;
};

/**
 * Validate enum value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Allowed values
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

/**
 * Validate phone number (basic)
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  // Basic phone validation (can be enhanced)
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidDate,
  isValidDateRange,
  validateRequired,
  isValidNumberRange,
  isValidStringLength,
  isValidEnum,
  isValidPhone,
};

