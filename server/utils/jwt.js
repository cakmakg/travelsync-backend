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
 * Verify Refresh Token (with blacklist check)
 * Checks both JWT validity AND blacklist status
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyRefreshTokenWithBlacklist = async (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  // First, check if token is blacklisted
  const { isTokenBlacklisted } = require('../services/token.service');
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    const error = new Error('Token has been revoked');
    error.name = 'TokenBlacklistError';
    error.statusCode = 401;
    throw error;
  }

  // Then verify JWT signature and expiry
  return jwt.verify(token, secret);
};

/**
 * Generate both tokens
 * @param {Object} user - User object
 * @returns {Object} { access_token, refresh_token }
 */
const generateTokens = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role,
    organization_id: user.organization_id,
  };

  return {
    access_token: generateAccessToken(payload),
    refresh_token: generateRefreshToken(payload),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyRefreshTokenWithBlacklist,
  generateTokens,
};