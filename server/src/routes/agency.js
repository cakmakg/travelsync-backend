"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Routes (FIXED)
------------------------------------------------------- */

const router = require('express').Router();
const agencyController = require('../controllers/agency');
const { authenticate, authorize } = require('../middlewares/auth');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/agencies
 * @desc    Get all agencies
 * @access  Private (Admin, Manager)
 */
router.get('/', authorize('admin', 'manager'), agencyController.getAll);

/**
 * @route   GET /api/v1/agencies/:id
 * @desc    Get agency by ID
 * @access  Private (Admin, Manager)
 */
router.get('/:id', authorize('admin', 'manager'), agencyController.getById);

/**
 * @route   POST /api/v1/agencies
 * @desc    Create new agency
 * @access  Private (Admin only)
 */
router.post('/', authorize('admin'), agencyController.create);

/**
 * @route   PUT /api/v1/agencies/:id
 * @desc    Update agency
 * @access  Private (Admin only)
 */
router.put('/:id', authorize('admin'), agencyController.update);

/**
 * @route   DELETE /api/v1/agencies/:id
 * @desc    Soft delete agency (set is_active = false)
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('admin'), agencyController.delete);

/**
 * @route   GET /api/v1/agencies/:id/bookings
 * @desc    Get agency bookings
 * @access  Private (Admin, Manager)
 * @query   start_date, end_date, status, page, limit
 */
router.get('/:id/bookings', authorize('admin', 'manager'), agencyController.getBookings);

/**
 * @route   GET /api/v1/agencies/:id/commission-report
 * @desc    Get commission report for agency
 * @access  Private (Admin, Manager)
 * @query   start_date, end_date, status
 */
router.get('/:id/commission-report', authorize('admin', 'manager'), agencyController.getCommissionReport);

/**
 * @route   POST /api/v1/agencies/:id/mark-commission-paid
 * @desc    Mark commission as paid for specific bookings
 * @access  Private (Admin only)
 * @body    { booking_ids: [...] }
 */
router.post('/:id/mark-commission-paid', authorize('admin'), agencyController.markCommissionPaid);

module.exports = router;