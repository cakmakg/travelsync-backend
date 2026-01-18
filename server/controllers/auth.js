"use strict";
/* -------------------------------------------------------
    TravelSync - Auth Controller
------------------------------------------------------- */

const bcrypt = require('bcrypt');
const logger = require('../config/logger');
const { User, Organization, AuditLog } = require('../models');
const { generateTokens, verifyRefreshTokenWithBlacklist } = require('../utils/jwt');
const { validatePasswordStrength } = require('../utils/password');
const tokenService = require('../services/token.service');

/**
 * Register new user with organization (single-step registration)
 * POST /auth/register
 * Creates both organization and admin user in one request
 */
const register = async (req, res) => {
  try {
    const {
      // Organization fields
      organization_name,
      organization_type,
      country,
      timezone,
      currency,
      // User fields
      email,
      password,
      first_name,
      last_name,
      phone,
    } = req.body;

    // Validate required fields
    if (!organization_name || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: organization_name, email, password, first_name, last_name',
        },
      });
    }

    // Validate password strength (OWASP compliant)
    const passwordValidation = validatePasswordStrength(password, {
      minLength: 12,
      requireUpperCase: true,
      requireLowerCase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPatterns: true,
      checkAgainstEmail: email,
      checkCommonPasswords: true,
    });

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password does not meet security requirements',
          details: passwordValidation.errors,
          strength: passwordValidation.strength,
        },
      });
    }

    // Check if email already exists globally
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already registered.',
        },
      });
    }

    // Create organization first
    const organization = await Organization.create({
      name: organization_name,
      type: organization_type || 'HOTEL',
      country: country || 'TR',
      timezone: timezone || 'Europe/Istanbul',
      currency: currency || 'EUR',
      is_active: true,
    });

    // Create admin user for this organization
    const user = await User.create({
      organization_id: organization._id,
      email,
      password, // Will be hashed by the model
      first_name,
      last_name,
      role: 'admin', // First user is always admin
      phone,
    });

    // Log action (non-fatal)
    try {
      await require('../services/audit.service').logAction({
        action: 'CREATE',
        entity_type: 'organization',
        entity_id: organization._id,
        description: 'Organization and admin user registered',
      }, { _id: user._id, organization_id: organization._id, ip: req.ip, user_agent: req.headers['user-agent'] });
    } catch (auditError) {
      logger.warn('Audit log error:', auditError);
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        organization: organization.toObject(),
        ...tokens,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    logger.error('Register error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message),
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed. Please try again.',
      },
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password, organization_id } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email and password are required.',
        },
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({
      email,
      ...(organization_id && { organization_id }),
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials.',
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials.',
        },
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Log action (non-fatal)
    await require('../services/audit.service').logAction({
      action: 'LOGIN',
      entity_type: 'user',
      entity_id: user._id,
      description: 'User logged in',
    }, { _id: user._id, organization_id: user.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        ...tokens,
      },
      message: 'Login successful',
    });
  } catch (error) {
    logger.error('Login error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed. Please try again.',
      },
    });
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
const getProfile = async (req, res) => {
  try {
    // User is already attached by authenticate middleware
    const user = await User.findById(req.user._id)
      .populate('organization_id', 'name type country currency timezone');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile.',
      },
    });
  }
};

/**
 * Refresh access token
 * POST /auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required.',
        },
      });
    }

    // Verify refresh token (checks blacklist + JWT validity)
    let decoded;
    try {
      decoded = await verifyRefreshTokenWithBlacklist(refresh_token);
    } catch (error) {
      if (error.name === 'TokenBlacklistError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token has been revoked. Please login again.',
          },
        });
      }
      throw error;
    }

    // Get user
    const user = await User.findById(decoded._id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token.',
        },
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      data: {
        ...tokens,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    logger.error('Refresh token error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired refresh token.',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Token refresh failed.',
      },
    });
  }
};

/**
 * Logout user
 * POST /auth/logout
 * Blacklists the refresh token
 */
const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const user = req.user;

    // Log audit action first
    try {
      await require('../services/audit.service').logAction({
        action: 'LOGOUT',
        entity_type: 'user',
        entity_id: user._id,
        description: 'User logged out',
      }, { _id: user._id, organization_id: user.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });
    } catch (auditError) {
      logger.warn('Audit log error during logout:', auditError);
      // Continue with logout even if audit fails
    }

    // If refresh token provided, add to blacklist
    if (refresh_token) {
      try {
        await tokenService.blacklistRefreshToken(
          refresh_token,
          user._id,
          {
            organization_id: user.organization_id,
            reason: 'logout',
            ip: req.ip,
            user_agent: req.headers['user-agent'],
            notes: 'User initiated logout',
          }
        );
      } catch (blacklistError) {
        logger.warn('Error blacklisting token during logout:', blacklistError);
        // Log but continue - client should handle token as invalid anyway
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed.',
      },
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  refreshToken,
  logout,
};