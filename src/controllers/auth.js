"use strict";
/* -------------------------------------------------------
    TravelSync - Auth Controller
------------------------------------------------------- */

const bcrypt = require('bcrypt');
const { User, Organization, AuditLog } = require('../models');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

/**
 * Register new user
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const {
      organization_id,
      email,
      password,
      first_name,
      last_name,
      role,
      phone,
    } = req.body;

    // Validate required fields
    if (!organization_id || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: organization_id, email, password, first_name, last_name',
        },
      });
    }

    // Check if organization exists
    const organization = await Organization.findById(organization_id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Organization not found.',
        },
      });
    }

    // Check if organization is active
    if (!organization.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Organization is not active.',
        },
      });
    }

    // Check if email already exists in this organization
    const existingUser = await User.findOne({ organization_id, email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Email already registered in this organization.',
        },
      });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password must be at least 8 characters long.',
        },
      });
    }

    // Create user
    const user = await User.create({
      organization_id,
      email,
      password, // Will be hashed by the model
      first_name,
      last_name,
      role: role || 'staff',
      phone,
    });

    // Log action
    await AuditLog.logAction({
      organization_id,
      user_id: user._id,
      action: 'CREATE',
      entity_type: 'user',
      entity_id: user._id,
      description: 'User registered',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        tokens,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Register error:', error);

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

    // Log action
    await AuditLog.logAction({
      organization_id: user.organization_id,
      user_id: user._id,
      action: 'LOGIN',
      entity_type: 'user',
      entity_id: user._id,
      description: 'User logged in',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        tokens,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);

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
    console.error('Get profile error:', error);

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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required.',
        },
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

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
        tokens,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token error:', error);

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
 */
const logout = async (req, res) => {
  try {
    // Log action
    await AuditLog.logAction({
      organization_id: req.user.organization_id,
      user_id: req.user._id,
      action: 'LOGOUT',
      entity_type: 'user',
      entity_id: req.user._id,
      description: 'User logged out',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);

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