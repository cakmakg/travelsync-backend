"use strict";
/* -------------------------------------------------------
    TravelSync - Inventory Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/inventory
 * @desc    Get all inventory (with pagination, search, filter)
 * @access  Private
 */
router.get('/', authenticate, inventoryController.getAll);

/**
 * @route   GET /api/v1/inventory/:propertyId/:roomTypeId/range
 * @desc    Get inventory for a date range
 * @access  Private
 * @query   start_date, end_date
 */
router.get('/:propertyId/:roomTypeId/range', authenticate, inventoryController.getForDateRange);

/**
 * @route   GET /api/v1/inventory/:propertyId/:roomTypeId/availability
 * @desc    Check availability for booking
 * @access  Private
 * @query   check_in_date, check_out_date, rooms_requested
 */
router.get('/:propertyId/:roomTypeId/availability', authenticate, inventoryController.checkAvailability);

/**
 * @route   GET /api/v1/inventory/:propertyId/:roomTypeId/date
 * @desc    Get inventory for a specific date
 * @access  Private
 * @query   date
 */
router.get('/:propertyId/:roomTypeId/date', authenticate, inventoryController.getForDate);

/**
 * @route   GET /api/v1/inventory/:propertyId/:roomTypeId/calendar
 * @desc    Get availability calendar for a month
 * @access  Private
 * @query   year, month
 */
router.get('/:propertyId/:roomTypeId/calendar', authenticate, inventoryController.getAvailabilityCalendar);

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get inventory by ID
 * @access  Private
 */
router.get('/:id', authenticate, inventoryController.getById);

/**
 * @route   POST /api/v1/inventory
 * @desc    Create new inventory
 * @access  Private (Admin, Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), inventoryController.create);

/**
 * @route   POST /api/v1/inventory/:propertyId/:roomTypeId/increment-sold
 * @desc    Increment sold count (used when creating reservation)
 * @access  Private (Admin, Manager, Staff)
 * @body    { dates: [date1, date2, ...], quantity: 1 }
 */
router.post('/:propertyId/:roomTypeId/increment-sold', authenticate, authorize('admin', 'manager', 'staff'), inventoryController.incrementSold);

/**
 * @route   POST /api/v1/inventory/:propertyId/:roomTypeId/decrement-sold
 * @desc    Decrement sold count (used when cancelling reservation)
 * @access  Private (Admin, Manager, Staff)
 * @body    { dates: [date1, date2, ...], quantity: 1 }
 */
router.post('/:propertyId/:roomTypeId/decrement-sold', authenticate, authorize('admin', 'manager', 'staff'), inventoryController.decrementSold);

/**
 * @route   PUT /api/v1/inventory/:id
 * @desc    Update inventory
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), inventoryController.update);

/**
 * @route   PUT /api/v1/inventory/:propertyId/:roomTypeId/bulk-update
 * @desc    Bulk update inventory for a date range
 * @access  Private (Admin, Manager)
 * @body    { start_date, end_date, updates: { allotment?, stop_sell?, min_stay?, max_stay? } }
 */
router.put('/:propertyId/:roomTypeId/bulk-update', authenticate, authorize('admin', 'manager'), inventoryController.bulkUpdate);

/**
 * @route   PUT /api/v1/inventory/:propertyId/:roomTypeId/toggle-stop-sell
 * @desc    Toggle stop sell for specific dates
 * @access  Private (Admin, Manager)
 * @body    { dates: [date1, date2, ...], stop_sell: true/false }
 */
router.put('/:propertyId/:roomTypeId/toggle-stop-sell', authenticate, authorize('admin', 'manager'), inventoryController.toggleStopSell);

/**
 * @route   DELETE /api/v1/inventory/:id
 * @desc    Soft delete inventory
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), inventoryController.delete);

/**
 * @route   POST /api/v1/inventory/:id/restore
 * @desc    Restore soft deleted inventory
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), inventoryController.restore);

module.exports = router;