/**
 * 🎫 RESERVATION CONTROLLER
 * 
 * Guest booking management
 * Features: CRUD, check-in/out, cancellation, arrivals/departures
 */

const BaseController = require('./base');
const { Reservation } = require('../models');
const reservationService = require('../services/reservation.service');
const asyncHandler = require('../middlewares/asyncHandler');

class ReservationController extends BaseController {
  constructor() {
    super(Reservation, 'reservation');

    // Disable organization filtering (reservations filter by property)
    this.useOrganizationFilter = false;

    // Search fields for getAll
    this.searchFields = ['booking_reference', 'guest.name', 'guest.email'];

    // Populate fields
    this.populateFields = 'property_id room_type_id rate_plan_id created_by_user_id';
  }

  /**
   * ➕ CREATE RESERVATION (override to use service)
   */
  create = asyncHandler(async (req, res) => {
    const data = {
      ...req.body,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    };

    const reservation = await reservationService.createReservation(
      data,
      req.user
    );

    return res.created(reservation, 'Reservation created successfully');
  });

  /**
   * ❌ CANCEL RESERVATION
   * Cancel a reservation
   */
  cancel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.badRequest('Cancellation reason is required');
    }

    const reservation = await reservationService.cancelReservation(
      id,
      reason,
      req.user
    );

    return res.success(reservation, { message: 'Reservation cancelled successfully' });
  });

  /**
   * 🏨 CHECK-IN RESERVATION
   * Check-in a confirmed reservation
   */
  checkIn = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reservation = await reservationService.checkInReservation(
      id,
      req.user
    );

    return res.success(reservation, { message: 'Guest checked in successfully' });
  });

  /**
   * 🏁 CHECK-OUT RESERVATION
   * Check-out a checked-in reservation
   */
  checkOut = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reservation = await reservationService.checkOutReservation(
      id,
      req.user
    );

    return res.success(reservation, { message: 'Guest checked out successfully' });
  });

  /**
   * 📅 GET TODAY'S CHECK-INS
   * Get all reservations checking in today
   */
  getTodayCheckIns = asyncHandler(async (req, res) => {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.badRequest('Property ID is required');
    }

    const arrivals = await reservationService.getTodaysArrivals(propertyId, req.user);

    return res.success({ items: arrivals, count: arrivals.length });
  });

  /**
   * 🏁 GET TODAY'S CHECK-OUTS
   * Get all reservations checking out today
   */
  getTodayCheckOuts = asyncHandler(async (req, res) => {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.badRequest('Property ID is required');
    }

    const departures = await reservationService.getTodaysDepartures(propertyId, req.user);

    return res.success({ items: departures, count: departures.length });
  });

  /**
   * 🔍 GET BY STATUS
   * Get reservations by status
   */
  getByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    const { propertyId, page = 1, limit = 10 } = req.query;

    const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.badRequest({ message: 'Invalid status', valid_statuses: validStatuses });
    }

    const query = {
      status,
      deleted_at: null
    };

    if (propertyId) {
      query.property_id = propertyId;
    }

    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('property_id', 'name code')
        .populate('room_type_id', 'name code')
        .populate('rate_plan_id', 'name code')
        .sort('-created_at')
        .skip(skip)
        .limit(parseInt(limit)),
      Reservation.countDocuments(query)
    ]);

    return res.success({ items: reservations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) } });
  });

  /**
   * 📅 GET BY DATE RANGE
   * Get reservations within a date range
   */
  getByDateRange = asyncHandler(async (req, res) => {
    const { start_date, end_date, propertyId, page = 1, limit = 10 } = req.query;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    const query = {
      check_in_date: {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      },
      deleted_at: null
    };

    if (propertyId) {
      query.property_id = propertyId;
    }

    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('property_id', 'name code')
        .populate('room_type_id', 'name code')
        .populate('rate_plan_id', 'name code')
        .sort('check_in_date')
        .skip(skip)
        .limit(parseInt(limit)),
      Reservation.countDocuments(query)
    ]);

    return res.success({ items: reservations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) } });
  });

  /**
   * 🔍 GET BY BOOKING REFERENCE
   * Get reservation by booking reference
   */
  getByBookingReference = asyncHandler(async (req, res) => {
    const { bookingReference } = req.params;

    const reservation = await reservationService.getReservationByBookingReference(bookingReference, req.user);

    return res.success(reservation);
  });

  /**
   * 📊 GET STATISTICS
   * Get reservation statistics  /**
   * Get reservation statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.badRequest('Property ID is required');
    }

    const stats = await reservationService.getStats(propertyId, req.user);

    return res.success(stats);
  });

  // =============================================
  // OPTION (GEÇİCİ KİLİTLEME) METHODS
  // =============================================

  /**
   * Create option (geçici kilitleme)
   * POST /api/v1/reservations/options
   */
  createOption = asyncHandler(async (req, res) => {
    const option = await reservationService.createOption(req.body, req.user);
    return res.created(option, 'Option created successfully. Expires at: ' + option.option_expires_at);
  });

  /**
   * Confirm option - Option'ı rezervasyona çevir
   * POST /api/v1/reservations/:id/confirm-option
   */
  confirmOption = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { guest } = req.body;

    if (!guest || !guest.name || !guest.email || !guest.phone) {
      return res.badRequest('Guest information (name, email, phone) is required');
    }

    const reservation = await reservationService.confirmOption(id, guest, req.user);
    return res.success(reservation, { message: 'Option confirmed as reservation' });
  });

  /**
   * Expire all expired options
   * POST /api/v1/reservations/options/expire
   */
  expireOptions = asyncHandler(async (req, res) => {
    const result = await reservationService.expireOptions();
    return res.success(result, { message: `Expired ${result.expired} options` });
  });
}

// Export controller instance
module.exports = new ReservationController();