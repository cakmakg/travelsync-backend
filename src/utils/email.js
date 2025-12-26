"use strict";
/* -------------------------------------------------------
    TravelSync - Email Utility
    Email validation and formatting
------------------------------------------------------- */

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Normalize email (trim, lowercase)
 * @param {String} email - Email to normalize
 * @returns {String} - Normalized email
 */
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
};

module.exports = {
  isValidEmail,
  normalizeEmail,
};

