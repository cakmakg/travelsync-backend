"use strict";
/* -------------------------------------------------------
    TravelSync - Rate Plan Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const ratePlanController = require('../controllers/ratePlan');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/rate-plans
 * @desc    Get all rate plans (with pagination, search, filter)
 * @access  Private
 */
router.get('/', authenticate, ratePlanController.getAll);

/**
 * @route   GET /api/v1/rate-plans/property/:propertyId
 * @desc    Get all rate plans for a property
 * @access  Private
 */
router.get('/property/:propertyId', authenticate, ratePlanController.getByProperty);

/**
 * @route   GET /api/v1/rate-plans/property/:propertyId/public
 * @desc    Get all public rate plans for a property
 * @access  Public
 */
router.get('/property/:propertyId/public', ratePlanController.getPublic);

/**
 * @route   GET /api/v1/rate-plans/base/:baseRatePlanId/derived
 * @desc    Get all derived rate plans from a base rate plan
 * @access  Private
 */
router.get('/base/:baseRatePlanId/derived', authenticate, ratePlanController.getDerived);

/**
 * @route   GET /api/v1/rate-plans/:id
 * @desc    Get rate plan by ID
 * @access  Private
 */
router.get('/:id', authenticate, ratePlanController.getById);

/**
 * @route   GET /api/v1/rate-plans/:id/stats
 * @desc    Get rate plan statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, ratePlanController.getStats);

/**
 * @route   GET /api/v1/rate-plans/:id/check-validity
 * @desc    Check if rate plan is valid for a specific date
 * @access  Private
 * @query   date
 */
router.get('/:id/check-validity', authenticate, ratePlanController.checkValidity);

/**
 * @route   POST /api/v1/rate-plans
 * @desc    Create new rate plan
 * @access  Private (Admin, Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), ratePlanController.create);

/**
 * @route   PUT /api/v1/rate-plans/:id
 * @desc    Update rate plan
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), ratePlanController.update);

/**
 * @route   PUT /api/v1/rate-plans/:id/toggle-active
 * @desc    Toggle rate plan active status
 * @access  Private (Admin, Manager)
 */
router.put('/:id/toggle-active', authenticate, authorize('admin', 'manager'), ratePlanController.toggleActive);

/**
 * @route   PUT /api/v1/rate-plans/:id/toggle-public
 * @desc    Toggle rate plan public status
 * @access  Private (Admin, Manager)
 */
router.put('/:id/toggle-public', authenticate, authorize('admin', 'manager'), ratePlanController.togglePublic);

/**
 * @route   PUT /api/v1/rate-plans/:id/cancellation-policy
 * @desc    Update rate plan cancellation policy
 * @access  Private (Admin, Manager)
 */
router.put('/:id/cancellation-policy', authenticate, authorize('admin', 'manager'), ratePlanController.updateCancellationPolicy);

/**
 * @route   DELETE /api/v1/rate-plans/:id
 * @desc    Soft delete rate plan
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), ratePlanController.delete);

/**
 * @route   POST /api/v1/rate-plans/:id/restore
 * @desc    Restore soft deleted rate plan
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), ratePlanController.restore);

module.exports = router;