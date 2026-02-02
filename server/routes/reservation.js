"use strict";
/* -------------------------------------------------------
    TravelSync - Reservation Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/reservations
 * @desc    Get all reservations (with pagination, search, filter)
 * @access  Private
 */
router.get('/', authenticate, reservationController.getAll);

/**
 * @route   GET /api/v1/reservations/today/check-ins
 * @desc    Get today's check-ins (arrivals)
 * @access  Private
 * @query   propertyId
 */
router.get('/today/check-ins', authenticate, reservationController.getTodayCheckIns);

/**
 * @route   GET /api/v1/reservations/today/check-outs
 * @desc    Get today's check-outs (departures)
 * @access  Private
 * @query   propertyId
 */
router.get('/today/check-outs', authenticate, reservationController.getTodayCheckOuts);

/**
 * @route   GET /api/v1/reservations/status/:status
 * @desc    Get reservations by status
 * @access  Private
 * @query   propertyId, page, limit
 */
router.get('/status/:status', authenticate, reservationController.getByStatus);

/**
 * @route   GET /api/v1/reservations/date-range
 * @desc    Get reservations within a date range
 * @access  Private
 * @query   start_date, end_date, propertyId, page, limit
 */
router.get('/date-range', authenticate, reservationController.getByDateRange);

/**
 * @route   GET /api/v1/reservations/stats
 * @desc    Get reservation statistics
 * @access  Private (Admin, Manager)
 * @query   propertyId
 */
router.get('/stats', authenticate, authorize('admin', 'manager'), reservationController.getStats);

/**
 * @route   GET /api/v1/reservations/reference/:bookingReference
 * @desc    Get reservation by booking reference
 * @access  Private
 */
router.get('/reference/:bookingReference', authenticate, reservationController.getByBookingReference);

/**
 * @route   GET /api/v1/reservations/:id
 * @desc    Get reservation by ID
 * @access  Private
 */
router.get('/:id', authenticate, reservationController.getById);

/**
 * @route   POST /api/v1/reservations
 * @desc    Create new reservation
 * @access  Private (Admin, Manager, Staff)
 * @body    { property_id, room_type_id, rate_plan_id, check_in_date, check_out_date, guests, guest }
 */
router.post('/', authenticate, authorize('admin', 'manager', 'staff'), reservationController.create);

/**
 * @route   POST /api/v1/reservations/:id/check-in
 * @desc    Check-in a confirmed reservation
 * @access  Private (Admin, Manager, Staff)
 */
router.post('/:id/check-in', authenticate, authorize('admin', 'manager', 'staff'), reservationController.checkIn);

/**
 * @route   POST /api/v1/reservations/:id/check-out
 * @desc    Check-out a checked-in reservation
 * @access  Private (Admin, Manager, Staff)
 */
router.post('/:id/check-out', authenticate, authorize('admin', 'manager', 'staff'), reservationController.checkOut);

/**
 * @route   POST /api/v1/reservations/:id/cancel
 * @desc    Cancel a reservation
 * @access  Private (Admin, Manager)
 * @body    { reason: string }
 */
router.post('/:id/cancel', authenticate, authorize('admin', 'manager'), reservationController.cancel);

/**
 * @route   PUT /api/v1/reservations/:id
 * @desc    Update reservation
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), reservationController.update);

/**
 * @route   DELETE /api/v1/reservations/:id
 * @desc    Soft delete reservation
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), reservationController.delete);

/**
 * @route   POST /api/v1/reservations/:id/restore
 * @desc    Restore soft deleted reservation
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), reservationController.restore);

// =============================================
// OPTION (GEÇİCİ KİLİTLEME) ROUTES
// =============================================

/**
 * @route   POST /api/v1/reservations/options
 * @desc    Create option (geçici kilitleme) - Acente oda kilitler
 * @access  Private
 * @body    { property_id, room_type_id, rate_plan_id, check_in_date, check_out_date, option_hours?, agency_id? }
 */
router.post('/options', authenticate, reservationController.createOption);

/**
 * @route   POST /api/v1/reservations/:id/confirm-option
 * @desc    Confirm option - Option'ı gerçek rezervasyona çevir
 * @access  Private
 * @body    { guest: { name, email, phone, country?, special_requests? } }
 */
router.post('/:id/confirm-option', authenticate, reservationController.confirmOption);

/**
 * @route   POST /api/v1/reservations/options/expire
 * @desc    Expire all expired options (cron job için)
 * @access  Private (Admin only)
 */
router.post('/options/expire', authenticate, authorize('admin'), reservationController.expireOptions);

module.exports = router;