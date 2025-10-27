"use strict";
/* -------------------------------------------------------
    TravelSync - AuditLog Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const AuditLogSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Action performed
    action: {
      type: String,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'CANCEL',
        'CHECK_IN',
        'CHECK_OUT',
        'EXPORT',
        'IMPORT',
      ],
      required: [true, 'Action is required'],
      index: true,
    },

    // Entity type
    entity_type: {
      type: String,
      enum: [
        'organization',
        'user',
        'property',
        'room_type',
        'rate_plan',
        'price',
        'inventory',
        'reservation',
        'setting',
      ],
      required: [true, 'Entity type is required'],
      index: true,
    },

    // Entity ID (the record that was affected)
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        // Not required for LOGIN/LOGOUT actions
        return !['LOGIN', 'LOGOUT'].includes(this.action);
      },
      index: true,
    },

    // Changes made (before/after)
    changes: {
      before: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      after: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    // Description
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Request metadata
    ip_address: {
      type: String,
      trim: true,
    },

    user_agent: {
      type: String,
      trim: true,
    },

    // Timestamp (automatically added by timestamps: true)
    // But we keep it here for explicit documentation
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'audit_logs',
    timestamps: { createdAt: 'timestamp', updatedAt: false }, // Only createdAt needed
  }
);

// Indexes
AuditLogSchema.index({ organization_id: 1, timestamp: -1 });
AuditLogSchema.index({ user_id: 1, timestamp: -1 });
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// Statics
AuditLogSchema.statics.logAction = async function (data) {
  return this.create({
    organization_id: data.organization_id,
    user_id: data.user_id,
    action: data.action,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    changes: data.changes || {},
    description: data.description,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
  });
};

AuditLogSchema.statics.findByEntity = function (entityType, entityId) {
  return this.find({
    entity_type: entityType,
    entity_id: entityId,
  })
    .sort({ timestamp: -1 })
    .populate('user_id', 'first_name last_name email');
};

AuditLogSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({ user_id: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByOrganization = function (
  organizationId,
  filters = {},
  limit = 100
) {
  return this.find({
    organization_id: organizationId,
    ...filters,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user_id', 'first_name last_name email');
};

AuditLogSchema.statics.findByDateRange = function (
  organizationId,
  startDate,
  endDate
) {
  return this.find({
    organization_id: organizationId,
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .populate('user_id', 'first_name last_name email');
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);