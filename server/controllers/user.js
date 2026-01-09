/**
 * 👤 USER CONTROLLER
 * 
 * Staff account management
 * Features: CRUD, role management, permission checks
 */

const BaseController = require('./base');
const { User } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');
const userService = require('../services/user.service');

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
   * ➕ CREATE USER (uses userService)
   */
  create = asyncHandler(async (req, res) => {
    const data = {
      ...req.body,
      organization_id: req.user?.organization_id
    };

    const user = await userService.createUser(data, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.created(user, 'User created successfully');
  });

  /**
   * 🔐 UPDATE PASSWORD
   * Change user password
   */
  updatePassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    await userService.updatePassword(id, current_password, new_password, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(null, { message: 'Password updated successfully' });
  });

  /**
   * 🔑 UPDATE ROLE
   * Update user role
   */
  updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userService.updateRole(id, role, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(user, { message: 'User role updated successfully' });
  });

  /**
   * 🔄 TOGGLE ACTIVE STATUS
   * Enable/disable user account
   */
  toggleActive = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.toggleActive(id, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(user, { message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully` });
  });

  /**
   * ✅ CHECK PERMISSION
   * Check if user has specific permission
   */
  checkPermission = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resource, action } = req.query;

    const result = await userService.checkPermission(id, resource, action, { _id: req.user?._id, organization_id: req.user?.organization_id });

    return res.success({ ...result, resource, action });
  });

  /**
   * 📋 GET BY ORGANIZATION
   * Get all users in an organization
   */
  getByOrganization = asyncHandler(async (req, res) => {
    const organizationId = req.user?.organization_id;

    const users = await userService.getByOrganization(organizationId);

    return res.success(users);
  });
}

// Export controller instance
module.exports = new UserController();