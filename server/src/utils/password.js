"use strict";
/* -------------------------------------------------------
    TravelSync - Password Utility
    Password hashing and validation
------------------------------------------------------- */

const bcrypt = require('bcrypt');

/**
 * Hash password
 * @param {String} password - Plain text password
 * @param {Number} saltRounds - Salt rounds (default: 10)
 * @returns {Promise<String>} - Hashed password
 */
const hashPassword = async (password, saltRounds = 10) => {
  if (!password) {
    throw new Error('Password is required');
  }
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} - True if match, false otherwise
 */
const comparePassword = async (password, hash) => {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: Boolean, errors: String[] }
 */
const validatePasswordStrength = (password, options = {}) => {
  const {
    minLength = 8,
    requireUpperCase = true,
    requireLowerCase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  const errors = [];

  if (!password || password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUpperCase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowerCase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
};

