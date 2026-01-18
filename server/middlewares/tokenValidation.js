"use strict";
/* -------------------------------------------------------
    TravelSync - Token Validation Middleware
    Validates tokens and checks blacklist status
------------------------------------------------------- */

const tokenService = require('../services/token.service');

/**
 * Middleware to verify refresh token is not blacklisted
 * Use on refresh endpoint to add extra security layer
 */
const validateRefreshTokenNotBlacklisted = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return next(); // Let next middleware handle missing token
    }

    const isBlacklisted = await tokenService.isTokenBlacklisted(refresh_token);

    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token has been revoked. Please login again.',
        },
      });
    }

    next();
  } catch (error) {
    const logger = require('../config/logger');
    logger.error('[Token Validation] Error checking blacklist:', error.message);
    // On error, fail securely (require re-authentication)
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token validation failed. Please login again.',
      },
    });
  }
};

module.exports = {
  validateRefreshTokenNotBlacklisted,
};
