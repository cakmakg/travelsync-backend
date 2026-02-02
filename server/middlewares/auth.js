"use strict";
/* -------------------------------------------------------
    TravelSync - Auth Middleware
------------------------------------------------------- */

const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No token provided. Please login.',
        },
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found. Token invalid.',
        },
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'User account is deactivated.',
        },
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. Please login again.',
        },
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired. Please login again.',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed.',
      },
    });
  }
};

/**
 * Check if user has required role
 * @param {String[]} roles - Array of allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated.',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required role: ${roles.join(' or ')}`,
        },
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {String} resource - Resource name (e.g., 'reservations')
 * @param {String} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 */
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated.',
        },
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check specific permission
    const hasPermission = req.user.permissions?.[resource]?.[action];

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. You don't have permission to ${action} ${resource}.`,
        },
      });
    }

    next();
  };
};

/**
 * Check if user is Super Admin
 * Super Admin has access to all organizations and global data
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated.' },
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: { message: 'Super Admin yetkisi gerekli.' },
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  isSuperAdmin,
};