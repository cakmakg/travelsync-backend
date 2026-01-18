"use strict";
/* -------------------------------------------------------
    TravelSync - Token Blacklist Model
    Stores invalidated tokens (logout, refresh, etc.)
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const TokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
      trim: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },

    token_type: {
      type: String,
      enum: ['refresh', 'access', 'password_reset'],
      default: 'refresh',
      required: true,
    },

    reason: {
      type: String,
      enum: ['logout', 'password_changed', 'role_changed', 'account_disabled', 'admin_revoke', 'security'],
      default: 'logout',
      required: true,
    },

    expires_at: {
      type: Date,
      required: [true, 'Expiry time is required'],
      index: true,
      // TTL index: automatically delete after expiry
    },

    revoked_at: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    ip_address: {
      type: String,
      index: true,
    },

    user_agent: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// TTL Index: Auto-delete documents after 'expires_at'
TokenBlacklistSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
TokenBlacklistSchema.index({ user_id: 1, token_type: 1 });
TokenBlacklistSchema.index({ organization_id: 1, revoked_at: -1 });

/**
 * Find if token is blacklisted
 */
TokenBlacklistSchema.statics.isBlacklisted = async function (token) {
  const entry = await this.findOne({
    token,
    expires_at: { $gt: new Date() },
  });
  return !!entry;
};

/**
 * Add token to blacklist
 */
TokenBlacklistSchema.statics.addToBlacklist = async function (data) {
  return this.create(data);
};

/**
 * Revoke all tokens for user (security event)
 */
TokenBlacklistSchema.statics.revokeUserTokens = async function (userId, reason = 'security') {
  return this.updateMany(
    { user_id: userId, expires_at: { $gt: new Date() } },
    { reason, revoked_at: new Date() }
  );
};

/**
 * Cleanup expired entries (runs via cron or manual trigger)
 */
TokenBlacklistSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    expires_at: { $lt: new Date() },
  });
  return result;
};

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);
