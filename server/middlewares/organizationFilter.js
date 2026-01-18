"use strict";
/* -------------------------------------------------------
    TravelSync - Organization Filter Middleware
    Enforces organization isolation on all multi-tenant routes
------------------------------------------------------- */

const logger = require('../config/logger');

/**
 * Middleware: Ensure organization_id is present in request
 * Required for all protected routes that handle organization data
 */
const ensureOrganizationId = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' },
    });
  }

  if (!req.user.organization_id) {
    logger.error('[Organization Filter] User missing organization_id:', {
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
    });

    return res.status(403).json({
      success: false,
      error: { message: 'Organization context missing. Invalid user state.' },
    });
  }

  // Attach organization_id to request for easy access
  req.organization_id = req.user.organization_id;

  next();
};

/**
 * Middleware: Validate organization_id in request body/params
 * Ensures users cannot specify different organization_id than their own
 */
const validateOrganizationOwnership = (req, res, next) => {
  const requestedOrgId = req.body?.organization_id || req.query?.organization_id;

  if (requestedOrgId && requestedOrgId !== req.user.organization_id.toString()) {
    logger.warn('[Organization Filter] Organization ID mismatch attempt:', {
      userId: req.user._id,
      userOrgId: req.user.organization_id,
      requestedOrgId: requestedOrgId,
      endpoint: req.originalUrl,
    });

    return res.status(403).json({
      success: false,
      error: { message: 'Cannot access resources from other organizations' },
    });
  }

  next();
};

/**
 * Middleware: Validate organization_id in params (route params like :org_id)
 * Ensures organization in URL matches user's organization
 */
const validateParamOrganization = (paramName = 'organization_id') => {
  return (req, res, next) => {
    const paramOrgId = req.params[paramName];

    if (paramOrgId && paramOrgId !== req.user.organization_id.toString()) {
      logger.warn('[Organization Filter] Organization param mismatch:', {
        userId: req.user._id,
        userOrgId: req.user.organization_id,
        paramOrgId: paramOrgId,
        paramName: paramName,
      });

      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Organization mismatch.' },
      });
    }

    next();
  };
};

/**
 * Super Admin Bypass: Allow super_admin role to access other organizations
 * For administrative purposes only
 */
const bypassForSuperAdmin = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    // Super admin can access any organization
    // But we still log it for audit purposes
    if (req.body?.organization_id && req.body.organization_id !== req.user.organization_id.toString()) {
      logger.info('[Organization Filter] Super admin accessing other organization:', {
        adminId: req.user._id,
        adminOrgId: req.user.organization_id,
        targetOrgId: req.body.organization_id,
        action: 'SUPER_ADMIN_OVERRIDE',
      });
    }
    return next();
  }

  // For non-super-admin users, apply strict validation
  return validateOrganizationOwnership(req, res, next);
};

module.exports = {
  ensureOrganizationId,
  validateOrganizationOwnership,
  validateParamOrganization,
  bypassForSuperAdmin,
};
