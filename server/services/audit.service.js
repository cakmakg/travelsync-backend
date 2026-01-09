"use strict";
/* -------------------------------------------------------
    TravelSync - Audit Service
    Centralized wrapper around AuditLog.logAction
------------------------------------------------------- */

const { AuditLog } = require('../models');

/**
 * Wrapper for AuditLog.logAction with standard fields and non-fatal handling.
 * @param {Object} params - Audit log params
 * @param {Object} actor - Optional actor info { _id, organization_id, ip, user_agent }
 */
exports.logAction = async (params = {}, actor = {}) => {
  try {
    const payload = {
      organization_id: params.organization_id || actor.organization_id || null,
      user_id: params.user_id || actor._id || null,
      action: params.action || 'ACTION',
      entity_type: params.entity_type || null,
      entity_id: params.entity_id || null,
      changes: params.changes || null,
      description: params.description || null,
      ip_address: params.ip_address || actor.ip || null,
      user_agent: params.user_agent || actor.user_agent || null,
    };

    // Avoid throwing errors: audit failure should not break main flow
    await AuditLog.logAction(payload);
  } catch (error) {
    // Log warning but don't rethrow
    console.warn('[AuditService] logAction failed:', error.message);
  }
};

module.exports = exports;
