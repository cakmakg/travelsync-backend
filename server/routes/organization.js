"use strict";
/* -------------------------------------------------------
    TravelSync - Organization Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/organizations
 * @desc    Get all organizations (with pagination, search, filter)
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('admin'), organizationController.getAll);

/**
 * @route   GET /api/v1/organizations/active
 * @desc    Get all active organizations
 * @access  Private (Admin only)
 */
router.get('/active', authenticate, authorize('admin'), organizationController.getActive);

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize('admin'), organizationController.getById);

/**
 * @route   GET /api/v1/organizations/:id/stats
 * @desc    Get organization statistics
 * @access  Private (Admin only)
 */
router.get('/:id/stats', authenticate, authorize('admin'), organizationController.getStats);

/**
 * @route   POST /api/v1/organizations
 * @desc    Create new organization
 * @access  Private (Admin only)
 */
router.post('/',  organizationController.create);

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update organization
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize('admin'), organizationController.update);

/**
 * @route   PUT /api/v1/organizations/:id/subscription
 * @desc    Update organization subscription
 * @access  Private (Admin only)
 */
router.put('/:id/subscription', authenticate, authorize('admin'), organizationController.updateSubscription);

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Soft delete organization
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), organizationController.delete);

/**
 * @route   POST /api/v1/organizations/:id/restore
 * @desc    Restore soft deleted organization
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), organizationController.restore);

module.exports = router;