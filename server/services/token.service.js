"use strict";
/* -------------------------------------------------------
    TravelSync - Token Service
    Manages token blacklist and token operations
------------------------------------------------------- */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { TokenBlacklist } = require('../models');

/**
 * Add refresh token to blacklist (on logout)
 * @param {String} token - Refresh token to blacklist
 * @param {String} userId - User ID
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>}
 */
exports.blacklistRefreshToken = async (token, userId, metadata = {}) => {
  try {
    if (!token || !userId) {
      throw new Error('Token and userId are required');
    }

    // Decode token to get expiry time
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token format');
    }

    // Token expiry in UTC
    const expiresAt = new Date(decoded.exp * 1000);

    const blacklistEntry = await TokenBlacklist.addToBlacklist({
      token,
      user_id: userId,
      organization_id: metadata.organization_id || null,
      token_type: 'refresh',
      reason: metadata.reason || 'logout',
      expires_at: expiresAt,
      ip_address: metadata.ip || null,
      user_agent: metadata.user_agent || null,
      notes: metadata.notes || null,
    });

    return blacklistEntry;
  } catch (error) {
    logger.error('[TokenService] Error blacklisting refresh token:', error.message);
    throw error;
  }
};

/**
 * Check if token is blacklisted
 * @param {String} token - Token to check
 * @returns {Promise<Boolean>}
 */
exports.isTokenBlacklisted = async (token) => {
  try {
    if (!token) return false;

    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    return isBlacklisted;
  } catch (error) {
    logger.error('[TokenService] Error checking blacklist:', error.message);
    // In case of database error, deny access (fail securely)
    return true;
  }
};

/**
 * Revoke all tokens for user (security event like password change)
 * @param {String} userId - User ID
 * @param {String} reason - Reason for revocation
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>}
 */
exports.revokeUserTokens = async (userId, reason = 'security', metadata = {}) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Get all active tokens for this user
    const activeTokens = await TokenBlacklist.find({
      user_id: userId,
      expires_at: { $gt: new Date() },
    });

    // Add all to blacklist
    await TokenBlacklist.revokeUserTokens(userId, reason);

    return {
      success: true,
      revoked_count: activeTokens.length,
      message: `Revoked ${activeTokens.length} active token(s)`,
    };
  } catch (error) {
    logger.error('[TokenService] Error revoking user tokens:', error.message);
    throw error;
  }
};

/**
 * Cleanup expired blacklist entries
 * Should be run periodically (cron job)
 * @returns {Promise<Object>}
 */
exports.cleanupExpiredBlacklist = async () => {
  try {
    const result = await TokenBlacklist.cleanupExpired();
    logger.info(`[TokenService] Cleaned up ${result.deletedCount} expired blacklist entries`);
    return result;
  } catch (error) {
    logger.error('[TokenService] Error cleaning up blacklist:', error.message);
    throw error;
  }
};

/**
 * Get token blacklist statistics for user
 * @param {String} userId - User ID
 * @returns {Promise<Object>}
 */
exports.getUserTokenStats = async (userId) => {
  try {
    const stats = await TokenBlacklist.aggregate([
      { $match: { user_id: require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  } catch (error) {
    logger.error('[TokenService] Error getting token stats:', error.message);
    return [];
  }
};

/**
 * Verify token is not blacklisted before use
 * @param {String} token - Token to verify
 * @param {String} tokenType - Type of token (refresh, access)
 * @returns {Promise<Boolean>}
 */
exports.verifyTokenNotBlacklisted = async (token, tokenType = 'refresh') => {
  try {
    const isBlacklisted = await TokenBlacklist.findOne({
      token,
      token_type: tokenType,
      expires_at: { $gt: new Date() },
    });

    return !isBlacklisted;
  } catch (error) {
    logger.error('[TokenService] Error verifying token:', error.message);
    return false;
  }
};
