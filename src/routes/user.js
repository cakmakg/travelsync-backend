"use strict";
/* -------------------------------------------------------
    TravelSync - User Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (with pagination, search, filter)
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), userController.getAll);

/**
 * @route   GET /api/v1/users/organization
 * @desc    Get all users in current organization
 * @access  Private (Admin, Manager)
 */
router.get('/organization', authenticate, authorize('admin', 'manager'), userController.getByOrganization);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, userController.getById);

/**
 * @route   GET /api/v1/users/:id/permissions
 * @desc    Check if user has specific permission
 * @access  Private (Admin, Manager)
 * @query   resource, action
 */
router.get('/:id/permissions', authenticate, authorize('admin', 'manager'), userController.checkPermission);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin, Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), userController.create);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), userController.update);

/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/:id/password', authenticate, userController.updatePassword);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.put('/:id/role', authenticate, authorize('admin'), userController.updateRole);

/**
 * @route   PUT /api/v1/users/:id/toggle-active
 * @desc    Toggle user active status
 * @access  Private (Admin, Manager)
 */
router.put('/:id/toggle-active', authenticate, authorize('admin', 'manager'), userController.toggleActive);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Soft delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), userController.delete);

/**
 * @route   POST /api/v1/users/:id/restore
 * @desc    Restore soft deleted user
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), userController.restore);

module.exports = router;