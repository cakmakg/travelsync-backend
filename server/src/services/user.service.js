"use strict";
/* -------------------------------------------------------
    TravelSync - User Service
    Centralize user business logic & audit logs
------------------------------------------------------- */

const bcrypt = require('bcrypt');
const { User } = require('../models');

const VALID_ROLES = ['org_admin', 'property_manager', 'front_desk', 'staff'];

/**
 * Create user (validations + audit log)
 */
exports.createUser = async (data, actor) => {
  // Basic validations
  if (!data.password) {
    const err = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }

  if (data.role && !VALID_ROLES.includes(data.role)) {
    const err = new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Check uniqueness
  const exists = await User.findOne({
    email: data.email,
    organization_id: data.organization_id,
    deleted_at: null,
  });

  if (exists) {
    const err = new Error('Email already exists in this organization');
    err.statusCode = 409;
    throw err;
  }

  // Create user (model pre-save hooks handle password hashing)
  const user = await User.create(data);

  const userObj = user.toObject();
  delete userObj.password;

  // Audit
  // Log audit (non-fatal)
  await require('./audit.service').logAction({
    action: 'CREATE',
    entity_type: 'user',
    entity_id: user._id,
    changes: { before: null, after: userObj },
    description: 'User created',
  }, actor);


  return userObj;
};

/**
 * Update password
 */
exports.updatePassword = async (id, current_password, new_password, actor) => {
  if (!current_password || !new_password) {
    const err = new Error('Current password and new password are required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ _id: id, organization_id: actor.organization_id, deleted_at: null }).select('+password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const isValid = await bcrypt.compare(current_password, user.password);
  if (!isValid) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }

  user.password = new_password;
  await user.save();

  await require('./audit.service').logAction({
    action: 'UPDATE',
    entity_type: 'user',
    entity_id: user._id,
    description: 'Password updated',
  }, actor);

  return true;
};

/**
 * Update role
 */
exports.updateRole = async (id, role, actor) => {
  if (!role || !VALID_ROLES.includes(role)) {
    const err = new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ _id: id, organization_id: actor.organization_id, deleted_at: null });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  await require('./audit.service').logAction({
    action: 'UPDATE',
    entity_type: 'user',
    entity_id: user._id,
    changes: { before: { role: oldRole }, after: { role } },
    description: `User role updated from ${oldRole} to ${role}`,
  }, actor);

  return user;
};

/**
 * Toggle active flag
 */
exports.toggleActive = async (id, actor) => {
  const user = await User.findOne({ _id: id, organization_id: actor.organization_id, deleted_at: null });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const oldStatus = user.is_active;
  user.is_active = !user.is_active;
  await user.save();

  await require('./audit.service').logAction({
    action: 'UPDATE',
    entity_type: 'user',
    entity_id: user._id,
    changes: { before: { is_active: oldStatus }, after: { is_active: user.is_active } },
    description: `User ${user.is_active ? 'activated' : 'deactivated'}`,
  }, actor);

  return user;
};

/**
 * Check permission
 */
exports.checkPermission = async (id, resource, action, actor) => {
  if (!resource || !action) {
    const err = new Error('Resource and action are required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ _id: id, organization_id: actor.organization_id, deleted_at: null });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    has_permission: user.hasPermission(resource, action),
    role: user.role,
  };
};

/**
 * Get users by organization
 */
exports.getByOrganization = async (organizationId) => {
  const users = await User.findByOrganization(organizationId);
  // sanitize
  return users.map(u => {
    const obj = u.toObject();
    delete obj.password;
    return obj;
  });
};

module.exports = exports;