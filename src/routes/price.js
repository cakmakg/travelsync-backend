"use strict";
/* -------------------------------------------------------
    TravelSync - Price Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const priceController = require('../controllers/price');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/prices
 * @desc    Get all prices (with pagination, search, filter)
 * @access  Private
 */
router.get('/', authenticate, priceController.getAll);

/**
 * @route   GET /api/v1/prices/property/:propertyId
 * @desc    Get all prices for a property
 * @access  Private
 * @query   start_date, end_date, room_type_id, rate_plan_id, page, limit
 */
router.get('/property/:propertyId', authenticate, priceController.getByProperty);

/**
 * @route   GET /api/v1/prices/:propertyId/:roomTypeId/:ratePlanId/range
 * @desc    Get prices for a date range
 * @access  Private
 * @query   start_date, end_date
 */
router.get('/:propertyId/:roomTypeId/:ratePlanId/range', authenticate, priceController.getForDateRange);

/**
 * @route   GET /api/v1/prices/:propertyId/:roomTypeId/:ratePlanId/summary
 * @desc    Get price summary (min, max, avg) for a date range
 * @access  Private
 * @query   start_date, end_date
 */
router.get('/:propertyId/:roomTypeId/:ratePlanId/summary', authenticate, priceController.getPriceSummary);

/**
 * @route   GET /api/v1/prices/:propertyId/:roomTypeId/:ratePlanId/date
 * @desc    Get price for a specific date
 * @access  Private
 * @query   date
 */
router.get('/:propertyId/:roomTypeId/:ratePlanId/date', authenticate, priceController.getForDate);

/**
 * @route   GET /api/v1/prices/:id
 * @desc    Get price by ID
 * @access  Private
 */
router.get('/:id', authenticate, priceController.getById);

/**
 * @route   POST /api/v1/prices
 * @desc    Create new price
 * @access  Private (Admin, Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), priceController.create);

/**
 * @route   POST /api/v1/prices/bulk-upsert
 * @desc    Bulk create or update prices
 * @access  Private (Admin, Manager)
 * @body    { prices: [{ property_id, room_type_id, rate_plan_id, date, amount, ... }] }
 */
router.post('/bulk-upsert', authenticate, authorize('admin', 'manager'), priceController.bulkUpsert);

/**
 * @route   PUT /api/v1/prices/:id
 * @desc    Update price
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), priceController.update);

/**
 * @route   PUT /api/v1/prices/:propertyId/:roomTypeId/:ratePlanId/bulk-update
 * @desc    Bulk update prices for a date range
 * @access  Private (Admin, Manager)
 * @body    { start_date, end_date, amount?, is_available? }
 */
router.put('/:propertyId/:roomTypeId/:ratePlanId/bulk-update', authenticate, authorize('admin', 'manager'), priceController.bulkUpdateDateRange);

/**
 * @route   DELETE /api/v1/prices/:id
 * @desc    Soft delete price
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), priceController.delete);

/**
 * @route   DELETE /api/v1/prices/:propertyId/:roomTypeId/:ratePlanId/range
 * @desc    Delete prices for a date range
 * @access  Private (Admin only)
 * @body    { start_date, end_date }
 */
router.delete('/:propertyId/:roomTypeId/:ratePlanId/range', authenticate, authorize('admin'), priceController.deleteDateRange);

/**
 * @route   POST /api/v1/prices/:id/restore
 * @desc    Restore soft deleted price
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), priceController.restore);

module.exports = router;