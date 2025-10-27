"use strict";
/* -------------------------------------------------------
    TravelSync - JWT Utilities
------------------------------------------------------- */

const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 * @param {Object} payload - User data to encode
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'travelsync',
  });
};

/**
 * Generate Refresh Token (long-lived)
 * @param {Object} payload - User data to encode
 * @returns {String} JWT token
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'travelsync',
  });
};

/**
 * Verify Access Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret);
};

/**
 * Verify Refresh Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret);
};

/**
 * Generate both tokens
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role,
    organization_id: user.organization_id,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
};