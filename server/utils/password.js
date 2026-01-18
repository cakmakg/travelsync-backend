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
 * Validate password strength (STRONG by default)
 * 
 * Default Requirements (OWASP recommended):
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - NOT matching common patterns
 * - NOT matching user email
 * - NOT in common password list
 * 
 * @param {String} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: Boolean, errors: String[], strength: String }
 */
const validatePasswordStrength = (password, options = {}) => {
  const {
    minLength = 12,
    requireUpperCase = true,
    requireLowerCase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    preventCommonPatterns = true,
    checkAgainstEmail = null,
    checkCommonPasswords = true,
  } = options;

  const errors = [];
  let score = 0;

  // ===== BASIC CHECKS =====
  if (!password) {
    errors.push('Password is required');
    return {
      valid: false,
      errors,
      strength: 'invalid',
    };
  }

  // Check minimum length
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long (current: ${password.length})`);
  } else {
    score += 1;
  }

  // Check maximum length (prevent extremely long inputs)
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }

  // ===== COMPLEXITY CHECKS =====
  if (requireUpperCase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (requireUpperCase) {
    score += 1;
  }

  if (requireLowerCase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (requireLowerCase) {
    score += 1;
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (requireNumbers) {
    score += 1;
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>\[\]\-_=+;:]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  } else if (requireSpecialChars) {
    score += 1;
  }

  // ===== PATTERN CHECKS =====
  if (preventCommonPatterns) {
    // Prevent sequential numbers/letters
    if (/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|efgh|fghi|ghij|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz)/.test(password.toLowerCase())) {
      errors.push('Password cannot contain sequential numbers or letters');
    }

    // Prevent repeated characters
    if (/(.)(\\1{2,})/.test(password)) {
      errors.push('Password cannot contain more than 2 repeated characters in a row');
    }

    // Prevent keyboard patterns
    if (/(?:qwerty|asdfgh|zxcvbn|qazwsx|qweasd)/.test(password.toLowerCase())) {
      errors.push('Password cannot contain keyboard patterns');
    }

    // Prevent numeric sequences
    if (/\d{5,}/.test(password)) {
      errors.push('Password cannot contain 5 or more consecutive numbers');
    }
  }

  // ===== EMAIL CHECK =====
  if (checkAgainstEmail && password.toLowerCase().includes(checkAgainstEmail.toLowerCase())) {
    errors.push('Password cannot contain your email address or parts of it');
  }

  // ===== COMMON PASSWORD CHECK =====
  if (checkCommonPasswords) {
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567890', 'letmein', 'trustno1', 'dragon', 'baseball',
      'iloveyou', 'welcome', 'passw0rd', 'pass123', 'admin', 'admin123',
      'login', 'princess', 'solo', 'starwars', 'sunshine', 'shadow',
      'ashley', 'bailey', 'qweasd', 'michael', 'football', 'batman',
    ];

    const lowerPassword = password.toLowerCase();
    if (commonPasswords.includes(lowerPassword)) {
      errors.push('Password is too common. Please choose a more unique password');
    }
  }

  // ===== CALCULATE STRENGTH =====
  let strength = 'weak';
  if (errors.length === 0) {
    if (score >= 4 && password.length >= 14) {
      strength = 'very_strong';
    } else if (score >= 4 && password.length >= 12) {
      strength = 'strong';
    } else if (score >= 3) {
      strength = 'good';
    } else {
      strength = 'fair';
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
};

