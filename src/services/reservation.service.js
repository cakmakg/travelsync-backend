"use strict";
/* -------------------------------------------------------
    TravelSync - Reservation Service (Agency Support)
    File: src/service/reservationService.js
------------------------------------------------------- */
const { Reservation, Inventory, Price, Agency } = require('../models');

/**
 * Create reservation (WITH AGENCY SUPPORT)
 */
exports.createReservation = async (data, user) => {
  try {
    const {
      property_id,
      room_type_id,
      rate_plan_id,
      check_in_date,
      check_out_date,
      agency_id,
      agency_booking_ref,
      rooms_requested = 1,
    } = data;

    console.log('[Reservation] Creating reservation:', {
      property_id,
      room_type_id,
      rate_plan_id,
      check_in_date,
      check_out_date,
      agency_id,
    });

    // 1. Validate agency (if agency booking)
    let agency = null;
    if (agency_id) {
      agency = await Agency.findById(agency_id);
      if (!agency) {
        throw new Error('Agency not found');
      }
      if (!agency.is_active) {
        throw new Error('Agency is not active');
      }
      console.log('[Reservation] Agency validated:', agency.name);
    }

    // 2. Check availability
    const isAvailable = await Inventory.checkAvailability(
      property_id,
      room_type_id,
      new Date(check_in_date),
      new Date(check_out_date),
      rooms_requested
    );

    if (!isAvailable.available) {
      throw new Error(`Not available: ${isAvailable.reason}`);
    }

    console.log('[Reservation] Availability checked: OK');

    // 3. Calculate price
    console.log('[Reservation] Calculating price for:', {
      check_in_date,
      check_out_date,
    });

    const totalPrice = await Price.calculateTotalPrice(
      property_id,
      room_type_id,
      rate_plan_id,
      new Date(check_in_date),
      new Date(check_out_date)
    );

    // Handle if calculateTotalPrice returns an object or number
    const finalPrice = typeof totalPrice === 'object' ? totalPrice.total : totalPrice;

    console.log('[Reservation] Price calculated:', finalPrice);

    // 4. Calculate commission (if agency booking)
    let commissionData = {
      percentage: 0,
      amount: 0,
      currency: data.currency || 'EUR',
      status: 'PENDING',
    };

    if (agency) {
      const rate = agency.getCommissionRate(property_id);
      
      if (rate < 0 || rate > 50) {
        throw new Error(`Invalid commission rate: ${rate}%`);
      }

      commissionData = {
        percentage: rate,
        amount: Number(((finalPrice * rate) / 100).toFixed(2)),
        currency: data.currency || 'EUR',
        status: 'PENDING',
      };

      console.log('[Reservation] Commission calculated:', commissionData);
    }

    // 5. Create reservation
    const reservation = await Reservation.create({
      ...data,
      created_by_user_id: user._id,
      total_price: finalPrice,
      total_with_tax: Number((finalPrice * 1.07).toFixed(2)),
      source: agency_id ? 'AGENCY' : 'DIRECT',
      agency_id: agency_id || undefined,
      agency_booking_ref: agency_booking_ref || undefined,
      commission: agency_id ? commissionData : undefined,
      payment_responsibility: agency_id ? 'AGENCY' : 'GUEST',
    });

    console.log('[Reservation] Created:', reservation._id);

    // 6. Update inventory
    await Inventory.updateOnBooking(
      property_id,
      room_type_id,
      new Date(check_in_date),
      new Date(check_out_date),
      rooms_requested
    );

    console.log('[Reservation] Inventory updated');

    // 7. Update agency stats (if agency booking)
    if (agency_id) {
      await Agency.findByIdAndUpdate(agency_id, {
        $inc: {
          'stats.total_bookings': 1,
          'stats.total_revenue': finalPrice,
          'stats.total_commission': commissionData.amount,
        },
      });
      console.log('[Reservation] Agency stats updated');
    }

    return reservation;

  } catch (error) {
    console.error('[Reservation Service] Create error:', error.message);
    throw error;
  }
};

/**
 * Get all reservations
 */
exports.getAllReservations = async (filters = {}, user) => {
  try {
    const {
      property_id,
      room_type_id,
      status,
      check_in_date,
      check_out_date,
      page = 1,
      limit = 50,
    } = filters;

    const query = { organization_id: user.organization_id };

    if (property_id) query.property_id = property_id;
    if (room_type_id) query.room_type_id = room_type_id;
    if (status) query.status = status;

    if (check_in_date || check_out_date) {
      query.check_in_date = {};
      if (check_in_date) query.check_in_date.$gte = new Date(check_in_date);
      if (check_out_date) query.check_in_date.$lte = new Date(check_out_date);
    }

    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('property_id', 'name code')
        .populate('room_type_id', 'name code')
        .populate('rate_plan_id', 'name')
        .populate('agency_id', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Reservation.countDocuments(query),
    ]);

    return {
      reservations,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[Reservation Service] GetAll error:', error);
    throw error;
  }
};

/**
 * Get reservation by ID
 */
exports.getReservationById = async (id, user) => {
  try {
    const reservation = await Reservation.findOne({
      _id: id,
      organization_id: user.organization_id,
    })
      .populate('property_id')
      .populate('room_type_id')
      .populate('rate_plan_id')
      .populate('agency_id')
      .populate('created_by_user_id', 'name email');

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return reservation;
  } catch (error) {
    console.error('[Reservation Service] GetById error:', error);
    throw error;
  }
};

/**
 * Update reservation
 */
exports.updateReservation = async (id, updates, user) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      {
        _id: id,
        organization_id: user.organization_id,
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return reservation;
  } catch (error) {
    console.error('[Reservation Service] Update error:', error);
    throw error;
  }
};

/**
 * Cancel reservation (WITH COMMISSION REVERSAL)
 */
exports.cancelReservation = async (id, reason, user) => {
  try {
    const reservation = await Reservation.findOne({
      _id: id,
      organization_id: user.organization_id,
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status === 'cancelled') {
      throw new Error('Reservation already cancelled');
    }

    if (reservation.status === 'checked_out') {
      throw new Error('Cannot cancel checked-out reservation');
    }

    // Cancel reservation
    await reservation.cancel(reason);

    // Release inventory
    await Inventory.updateOnCancellation(
      reservation.property_id,
      reservation.room_type_id,
      new Date(reservation.check_in_date),
      new Date(reservation.check_out_date),
      reservation.rooms_requested || 1
    );

    // Reverse agency stats (if agency booking)
    if (reservation.agency_id) {
      await Agency.findByIdAndUpdate(reservation.agency_id, {
        $inc: {
          'stats.total_bookings': -1,
          'stats.total_revenue': -reservation.total_price,
          'stats.total_commission': -(reservation.commission?.amount || 0),
        },
      });
    }

    return reservation;
  } catch (error) {
    console.error('[Reservation Service] Cancel error:', error);
    throw error;
  }
};

/**
 * Check-in reservation
 */
exports.checkInReservation = async (id, user) => {
  try {
    const reservation = await Reservation.findOne({
      _id: id,
      organization_id: user.organization_id,
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    await reservation.checkIn();
    return reservation;
  } catch (error) {
    console.error('[Reservation Service] CheckIn error:', error);
    throw error;
  }
};

/**
 * Check-out reservation
 */
exports.checkOutReservation = async (id, user) => {
  try {
    const reservation = await Reservation.findOne({
      _id: id,
      organization_id: user.organization_id,
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    await reservation.checkOut();
    return reservation;
  } catch (error) {
    console.error('[Reservation Service] CheckOut error:', error);
    throw error;
  }
};

/**
 * Get agency bookings
 */
exports.getAgencyBookings = async (agencyId, filters = {}) => {
  try {
    const { start_date, end_date, status, page = 1, limit = 50 } = filters;
    const query = { agency_id: agencyId };

    if (start_date || end_date) {
      query.check_in_date = {};
      if (start_date) query.check_in_date.$gte = new Date(start_date);
      if (end_date) query.check_in_date.$lte = new Date(end_date);
    }

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Reservation.find(query)
        .populate('property_id', 'name code city country')
        .populate('room_type_id', 'name')
        .populate('rate_plan_id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Reservation.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[Reservation Service] GetAgencyBookings error:', error);
    throw error;
  }
};

/**
 * Get commission report
 */
exports.getCommissionReport = async (agencyId, filters = {}) => {
  try {
    const { start_date, end_date, status } = filters;
    const query = { agency_id: agencyId };

    if (start_date || end_date) {
      query.check_in_date = {};
      if (start_date) query.check_in_date.$gte = new Date(start_date);
      if (end_date) query.check_in_date.$lte = new Date(end_date);
    }

    if (status) query['commission.status'] = status;

    const bookings = await Reservation.find(query).lean();

    const report = {
      total_bookings: bookings.length,
      total_revenue: bookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
      total_commission: bookings.reduce((sum, b) => sum + (b.commission?.amount || 0), 0),
      by_status: {
        pending: { count: 0, amount: 0 },
        invoiced: { count: 0, amount: 0 },
        paid: { count: 0, amount: 0 },
      },
    };

    bookings.forEach(booking => {
      const commissionStatus = (booking.commission?.status || 'pending').toLowerCase();
      const amount = booking.commission?.amount || 0;
      if (report.by_status[commissionStatus]) {
        report.by_status[commissionStatus].count++;
        report.by_status[commissionStatus].amount += amount;
      }
    });

    return report;
  } catch (error) {
    console.error('[Reservation Service] GetCommissionReport error:', error);
    throw error;
  }
};

/**
 * Mark commission as paid
 */
exports.markCommissionPaid = async (agencyId, bookingIds) => {
  try {
    const result = await Reservation.updateMany(
      {
        _id: { $in: bookingIds },
        agency_id: agencyId,
        'commission.status': { $ne: 'PAID' },
      },
      {
        $set: {
          'commission.status': 'PAID',
          'commission.paid_date': new Date(),
        },
      }
    );

    return {
      updated: result.modifiedCount,
      message: `Commission marked as paid for ${result.modifiedCount} bookings`,
    };
  } catch (error) {
    console.error('[Reservation Service] MarkCommissionPaid error:', error);
    throw error;
  }
};

module.exports = exports;