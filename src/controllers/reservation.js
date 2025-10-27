"use strict";
/* -------------------------------------------------------
    TravelSync - Reservation Controller
    Complex logic - Uses service layer
------------------------------------------------------- */

const reservationService = require('../services/reservation');
const { Reservation } = require('../models');

/**
 * Create reservation (with availability check & inventory update)
 * POST /api/v1/reservations
 * @access Private
 */
exports.create = async (req, res) => {
  try {
    const reservationData = {
      ...req.body,
      created_by_user_id: req.user._id,
    };

    // Use service layer for complex logic
    const reservation = await reservationService.createReservation(
      reservationData,
      req.user,
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      data: { reservation },
      message: 'Reservation created successfully',
    });
  } catch (error) {
    console.error('Create reservation error:', error);

    // Handle specific errors
    if (error.message.includes('not available')) {
      return res.status(409).json({
        success: false,
        error: {
          message: error.message,
          code: 'AVAILABILITY_ERROR',
        },
      });
    }

    if (error.message.includes('Idempotency')) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Duplicate reservation request',
          code: 'DUPLICATE_REQUEST',
        },
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message),
        },
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to create reservation' },
    });
  }
};

/**
 * Get all reservations
 * GET /api/v1/reservations
 * @access Private
 */
exports.getAll = async (req, res) => {
  try {
    const {
      property_id,
      status,
      check_in_from,
      check_in_to,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query = {};

    // Filter by property (for non-admin)
    if (req.user.role !== 'admin' && property_id) {
      query.property_id = property_id;
    }

    if (status) {
      query.status = status;
    }

    if (check_in_from || check_in_to) {
      query.check_in_date = {};
      if (check_in_from) query.check_in_date.$gte = new Date(check_in_from);
      if (check_in_to) query.check_in_date.$lte = new Date(check_in_to);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('property_id', 'name code')
        .populate('room_type_id', 'name code')
        .populate('rate_plan_id', 'name code meal_plan')
        .populate('created_by_user_id', 'first_name last_name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Reservation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reservations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch reservations' },
    });
  }
};

/**
 * Get single reservation
 * GET /api/v1/reservations/:id
 * @access Private
 */
exports.getById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('property_id')
      .populate('room_type_id')
      .populate('rate_plan_id')
      .populate('created_by_user_id', 'first_name last_name email');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Reservation not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: { reservation },
    });
  } catch (error) {
    console.error('Get reservation error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid reservation ID' },
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch reservation' },
    });
  }
};

/**
 * Update reservation
 * PUT /api/v1/reservations/:id
 * @access Private
 */
exports.update = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Reservation not found' },
      });
    }

    // Check if reservation can be updated
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot update cancelled reservation' },
      });
    }

    // Use service for complex updates
    const updatedReservation = await reservationService.updateReservation(
      req.params.id,
      req.body,
      req.user,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: { reservation: updatedReservation },
      message: 'Reservation updated successfully',
    });
  } catch (error) {
    console.error('Update reservation error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message),
        },
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to update reservation' },
    });
  }
};

/**
 * Cancel reservation
 * POST /api/v1/reservations/:id/cancel
 * @access Private
 */
exports.cancel = async (req, res) => {
  try {
    const { reason } = req.body;

    // Use service for cancellation logic
    const reservation = await reservationService.cancelReservation(
      req.params.id,
      reason,
      req.user,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: { reservation },
      message: 'Reservation cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { message: 'Reservation not found' },
      });
    }

    if (error.message.includes('Cannot cancel')) {
      return res.status(400).json({
        success: false,
        error: { message: error.message },
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel reservation' },
    });
  }
};

/**
 * Check-in reservation
 * POST /api/v1/reservations/:id/checkin
 * @access Private
 */
exports.checkIn = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Reservation not found' },
      });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only confirmed reservations can be checked in' },
      });
    }

    await reservation.checkIn();

    res.status(200).json({
      success: true,
      data: { reservation },
      message: 'Guest checked in successfully',
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check in' },
    });
  }
};

/**
 * Check-out reservation
 * POST /api/v1/reservations/:id/checkout
 * @access Private
 */
exports.checkOut = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Reservation not found' },
      });
    }

    if (reservation.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only checked-in guests can be checked out' },
      });
    }

    await reservation.checkOut();

    res.status(200).json({
      success: true,
      data: { reservation },
      message: 'Guest checked out successfully',
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check out' },
    });
  }
};

/**
 * Get today's check-ins
 * GET /api/v1/reservations/today/checkins
 * @access Private
 */
exports.getTodayCheckIns = async (req, res) => {
  try {
    const { property_id } = req.query;

    if (!property_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Property ID is required' },
      });
    }

    const checkIns = await Reservation.findTodayCheckIns(property_id);

    res.status(200).json({
      success: true,
      data: {
        check_ins: checkIns,
        count: checkIns.length,
      },
    });
  } catch (error) {
    console.error('Get today check-ins error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch check-ins' },
    });
  }
};

/**
 * Get today's check-outs
 * GET /api/v1/reservations/today/checkouts
 * @access Private
 */
exports.getTodayCheckOuts = async (req, res) => {
  try {
    const { property_id } = req.query;

    if (!property_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Property ID is required' },
      });
    }

    const checkOuts = await Reservation.findTodayCheckOuts(property_id);

    res.status(200).json({
      success: true,
      data: {
        check_outs: checkOuts,
        count: checkOuts.length,
      },
    });
  } catch (error) {
    console.error('Get today check-outs error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch check-outs' },
    });
  }
};