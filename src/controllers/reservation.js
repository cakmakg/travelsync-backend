/**
 * 🎫 RESERVATION CONTROLLER
 * 
 * Guest booking management
 * Features: CRUD, check-in/out, cancellation, arrivals/departures
 */

const BaseController = require('./base');
const { Reservation } = require('../models');
const reservationService = require('../services/reservation.service');

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
  create = async (req, res) => {
    try {
      const data = {
        ...req.body,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      };

      // Use service for complex logic
      const reservation = await reservationService.createReservation(
        data,
        req.user?._id
      );
      //pricing: reservation,
      res.status(201).json({
        success: true,
        data: reservation,
        
        message: 'Reservation created successfully'
      });
    } catch (error) {
      console.error('[Reservation] Create error:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: Object.values(error.errors).map(e => e.message)
          }
        });
      }

      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to create reservation'
        }
      });
    }
  };

  /**
   * ❌ CANCEL RESERVATION
   * Cancel a reservation
   */
  cancel = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cancellation reason is required' }
        });
      }

      const reservation = await reservationService.cancelReservation(
        id,
        req.user?._id,
        reason,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: reservation,
        message: 'Reservation cancelled successfully'
      });
    } catch (error) {
      console.error('[Reservation] Cancel error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to cancel reservation'
        }
      });
    }
  };

  /**
   * 🏨 CHECK-IN RESERVATION
   * Check-in a confirmed reservation
   */
  checkIn = async (req, res) => {
    try {
      const { id } = req.params;

      const reservation = await reservationService.checkInReservation(
        id,
        req.user?._id,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: reservation,
        message: 'Guest checked in successfully'
      });
    } catch (error) {
      console.error('[Reservation] Check-in error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to check-in guest'
        }
      });
    }
  };

  /**
   * 🏁 CHECK-OUT RESERVATION
   * Check-out a checked-in reservation
   */
  checkOut = async (req, res) => {
    try {
      const { id } = req.params;

      const reservation = await reservationService.checkOutReservation(
        id,
        req.user?._id,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        success: true,
        data: reservation,
        message: 'Guest checked out successfully'
      });
    } catch (error) {
      console.error('[Reservation] Check-out error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to check-out guest'
        }
      });
    }
  };

  /**
   * 📅 GET TODAY'S CHECK-INS
   * Get all reservations checking in today
   */
  getTodayCheckIns = async (req, res) => {
    try {
      const { propertyId } = req.query;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Property ID is required' }
        });
      }

      const arrivals = await reservationService.getTodaysArrivals(propertyId);

      res.status(200).json({
        success: true,
        data: arrivals,
        count: arrivals.length
      });
    } catch (error) {
      console.error('[Reservation] Get today check-ins error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get today\'s check-ins',
          details: error.message
        }
      });
    }
  };

  /**
   * 🏁 GET TODAY'S CHECK-OUTS
   * Get all reservations checking out today
   */
  getTodayCheckOuts = async (req, res) => {
    try {
      const { propertyId } = req.query;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Property ID is required' }
        });
      }

      const departures = await reservationService.getTodaysDepartures(propertyId);

      res.status(200).json({
        success: true,
        data: departures,
        count: departures.length
      });
    } catch (error) {
      console.error('[Reservation] Get today check-outs error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get today\'s check-outs',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔍 GET BY STATUS
   * Get reservations by status
   */
  getByStatus = async (req, res) => {
    try {
      const { status } = req.params;
      const { propertyId, page = 1, limit = 10 } = req.query;

      const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: { 
            message: 'Invalid status',
            valid_statuses: validStatuses
          }
        });
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

      res.status(200).json({
        success: true,
        data: {
          items: reservations,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('[Reservation] Get by status error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get reservations',
          details: error.message
        }
      });
    }
  };

  /**
   * 📅 GET BY DATE RANGE
   * Get reservations within a date range
   */
  getByDateRange = async (req, res) => {
    try {
      const { start_date, end_date, propertyId, page = 1, limit = 10 } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' }
        });
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

      res.status(200).json({
        success: true,
        data: {
          items: reservations,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('[Reservation] Get by date range error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get reservations',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔍 GET BY BOOKING REFERENCE
   * Get reservation by booking reference
   */
  getByBookingReference = async (req, res) => {
    try {
      const { bookingReference } = req.params;

      const reservation = await Reservation.findOne({
        booking_reference: bookingReference,
        deleted_at: null
      })
        .populate('property_id')
        .populate('room_type_id')
        .populate('rate_plan_id')
        .populate('created_by_user_id', 'first_name last_name email');

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: { message: 'Reservation not found' }
        });
      }

      res.status(200).json({
        success: true,
        data: reservation
      });
    } catch (error) {
      console.error('[Reservation] Get by booking reference error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get reservation',
          details: error.message
        }
      });
    }
  };

  /**
   * 📊 GET STATISTICS
   * Get reservation statistics
   */
  getStats = async (req, res) => {
    try {
      const { propertyId } = req.query;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Property ID is required' }
        });
      }

      const query = { property_id: propertyId, deleted_at: null };

      const [
        total,
        confirmed,
        checkedIn,
        checkedOut,
        cancelled,
        todaysArrivals,
        todaysDepartures
      ] = await Promise.all([
        Reservation.countDocuments(query),
        Reservation.countDocuments({ ...query, status: 'confirmed' }),
        Reservation.countDocuments({ ...query, status: 'checked_in' }),
        Reservation.countDocuments({ ...query, status: 'checked_out' }),
        Reservation.countDocuments({ ...query, status: 'cancelled' }),
        reservationService.getTodaysArrivals(propertyId),
        reservationService.getTodaysDepartures(propertyId)
      ]);

      const stats = {
        total_reservations: total,
        by_status: {
          confirmed,
          checked_in: checkedIn,
          checked_out: checkedOut,
          cancelled
        },
        today: {
          arrivals: todaysArrivals.length,
          departures: todaysDepartures.length
        }
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[Reservation] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get statistics',
          details: error.message
        }
      });
    }
  };
}

// Export controller instance
module.exports = new ReservationController();