/**
 * 👤 USER CONTROLLER
 * 
 * Staff account management
 * Features: CRUD, role management, permission checks
 */

const BaseController = require('./base');
const { User, AuditLog } = require('../models');

class UserController extends BaseController {
  constructor() {
    super(User, 'user');
    
    // Enable organization filtering for multi-tenant
    this.useOrganizationFilter = true;
    
    // Search fields for getAll
    this.searchFields = ['email', 'first_name', 'last_name'];
    
    // Populate fields
    this.populateFields = 'organization_id';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Check if email already exists in this organization
    const exists = await User.findOne({
      email: data.email,
      organization_id: data.organization_id,
      deleted_at: null
    });

    if (exists) {
      return 'Email already exists in this organization';
    }

    // Validate role
    const validRoles = ['org_admin', 'property_manager', 'front_desk', 'staff'];
    if (data.role && !validRoles.includes(data.role)) {
      return `Invalid role. Must be one of: ${validRoles.join(', ')}`;
    }

    return null;
  };

  /**
   * Custom validation for update
   */
  validateUpdate = async (data, existing) => {
    // Check if updating email and it already exists
    if (data.email && data.email !== existing.email) {
      const exists = await User.findOne({
        email: data.email,
        organization_id: existing.organization_id,
        _id: { $ne: existing._id },
        deleted_at: null
      });

      if (exists) {
        return 'Email already exists in this organization';
      }
    }

    // Validate role if updating
    const validRoles = ['org_admin', 'property_manager', 'front_desk', 'staff'];
    if (data.role && !validRoles.includes(data.role)) {
      return `Invalid role. Must be one of: ${validRoles.join(', ')}`;
    }

    return null;
  };

  /**
   * ➕ CREATE USER (override to hash password)
   */
  create = async (req, res) => {
    try {
      const data = {
        ...req.body,
        organization_id: req.user?.organization_id
      };

      // Validate
      if (this.validateCreate) {
        const validationError = await this.validateCreate(data);
        if (validationError) {
          return res.status(400).json({
            success: false,
            error: { message: validationError }
          });
        }
      }

      // Password will be hashed by User model pre-save hook
      if (!data.password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Password is required' }
        });
      }

      // Create user
      const user = await User.create(data);

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'CREATE',
        entity_type: 'user',
        entity_id: user._id,
        changes: {
          before: null,
          after: userObj
        },
        description: 'User created',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: userObj,
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('[User] Create error:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: Object.values(error.errors).map(e => e.message)
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create user',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔐 UPDATE PASSWORD
   * Change user password
   */
  updatePassword = async (req, res) => {
    try {
      const bcrypt = require('bcrypt');
      const { id } = req.params;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Current password and new password are required' }
        });
      }

      // Find user with password field (it's select: false by default)
      const user = await User.findOne({
        _id: id,
        organization_id: req.user?.organization_id,
        deleted_at: null
      }).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(current_password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { message: 'Current password is incorrect' }
        });
      }

      // Update password (will be hashed by pre-save hook)
      user.password = new_password;
      await user.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'UPDATE',
        entity_type: 'user',
        entity_id: user._id,
        description: 'Password updated',
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('[User] Update password error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update password',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔑 UPDATE ROLE
   * Update user role
   */
  updateRole = async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const validRoles = ['org_admin', 'property_manager', 'front_desk', 'staff'];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: { 
            message: 'Invalid role',
            valid_roles: validRoles
          }
        });
      }

      const user = await User.findOne({
        _id: id,
        organization_id: req.user?.organization_id,
        deleted_at: null
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      const oldRole = user.role;
      user.role = role;
      await user.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'UPDATE',
        entity_type: 'user',
        entity_id: user._id,
        changes: {
          before: { role: oldRole },
          after: { role: role }
        },
        description: `User role updated from ${oldRole} to ${role}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        data: user,
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('[User] Update role error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update role',
          details: error.message
        }
      });
    }
  };

  /**
   * ✅ CHECK PERMISSION
   * Check if user has specific permission
   */
  checkPermission = async (req, res) => {
    try {
      const { id } = req.params;
      const { resource, action } = req.query;

      if (!resource || !action) {
        return res.status(400).json({
          success: false,
          error: { message: 'Resource and action are required' }
        });
      }

      const user = await User.findOne({
        _id: id,
        organization_id: req.user?.organization_id,
        deleted_at: null
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      const hasPermission = user.hasPermission(resource, action);

      res.status(200).json({
        success: true,
        data: {
          has_permission: hasPermission,
          resource,
          action,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[User] Check permission error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to check permission',
          details: error.message
        }
      });
    }
  };

  /**
   * 📋 GET BY ORGANIZATION
   * Get all users in an organization
   */
  getByOrganization = async (req, res) => {
    try {
      const organizationId = req.user?.organization_id;

      const users = await User.findByOrganization(organizationId);

      // Remove password from all users
      const sanitizedUsers = users.map(user => {
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
      });

      res.status(200).json({
        success: true,
        data: sanitizedUsers
      });
    } catch (error) {
      console.error('[User] Get by organization error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get users',
          details: error.message
        }
      });
    }
  };
}

// Export controller instance
module.exports = new UserController();