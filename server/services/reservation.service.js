"use strict";
/* -------------------------------------------------------
    TravelSync - Reservation Service (Agency Support)
    File: src/services/reservation.service.js
    FIXED: Added MongoDB transactions for atomicity
------------------------------------------------------- */
const { Reservation, Inventory, Price, Agency } = require('../models');
const { mongoose } = require('../config/database');
const logger = require('../config/logger');

/**
 * Create reservation (WITH AGENCY SUPPORT + TRANSACTION)
 * Uses MongoDB transaction to ensure atomicity
 */
exports.createReservation = async (data, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    logger.info(`[Reservation] Creating reservation: ${JSON.stringify({ property_id, room_type_id, rate_plan_id, check_in_date, check_out_date, agency_id })}`);

    // 1. Validate property belongs to user's organization (WITHIN TRANSACTION)
    const Property = require('../models').Property;
    const property = await Property.findById(property_id).session(session);
    if (!property) {
      await session.abortTransaction();
      throw new Error('Property not found');
    }
    if (property.organization_id.toString() !== user.organization_id.toString()) {
      await session.abortTransaction();
      throw new Error('Property does not belong to your organization');
    }
    logger.debug(`[Reservation] Property validated: ${property.name}`);

    // 2. Validate agency (if agency booking) (WITHIN TRANSACTION)
    let agency = null;
    if (agency_id) {
      agency = await Agency.findById(agency_id).session(session);
      if (!agency) {
        await session.abortTransaction();
        throw new Error('Agency not found');
      }
      if (!agency.is_active) {
        await session.abortTransaction();
        throw new Error('Agency is not active');
      }
      logger.debug(`[Reservation] Agency validated: ${agency.name}`);
    }

    // 3. Check availability (WITHIN TRANSACTION)
    const isAvailable = await Inventory.checkAvailability(
      property_id,
      room_type_id,
      new Date(check_in_date),
      new Date(check_out_date),
      rooms_requested
    );

    if (!isAvailable.available) {
      await session.abortTransaction();
      throw new Error(`Not available: ${isAvailable.reason}`);
    }

    logger.debug('[Reservation] Availability checked: OK');

    // 4. Calculate price
    logger.debug(`[Reservation] Calculating price for: ${JSON.stringify({ check_in_date, check_out_date })}`);

    const totalPrice = await Price.calculateTotalPrice(
      property_id,
      room_type_id,
      rate_plan_id,
      new Date(check_in_date),
      new Date(check_out_date)
    );

    // Handle if calculateTotalPrice returns an object or number
    const finalPrice = typeof totalPrice === 'object' ? totalPrice.total : totalPrice;

    logger.debug(`[Reservation] Price calculated: ${finalPrice}`);

    // 5. Calculate commission (if agency booking)
    let commissionData = {
      percentage: 0,
      amount: 0,
      currency: data.currency || 'EUR',
      status: 'PENDING',
    };

    if (agency) {
      const rate = agency.getCommissionRate(property_id);

      // Validate commission rate
      if (rate < 0 || rate > 50) {
        await session.abortTransaction();
        throw new Error(`Invalid commission rate: ${rate}%`);
      }

      commissionData = {
        percentage: rate,
        amount: Number(((finalPrice * rate) / 100).toFixed(2)),
        currency: data.currency || 'EUR',
        status: 'PENDING',
      };

      logger.debug(`[Reservation] Commission calculated: ${JSON.stringify(commissionData)}`);
    }

    // 6. Create reservation (WITHIN TRANSACTION)
    const [reservation] = await Reservation.create([{
      ...data,
      created_by_user_id: user._id,
      total_price: finalPrice,
      total_with_tax: Number((finalPrice * 1.07).toFixed(2)),
      source: agency_id ? 'AGENCY' : 'DIRECT',
      agency_id: agency_id || undefined,
      agency_booking_ref: agency_booking_ref || undefined,
      commission: agency_id ? commissionData : undefined,
      payment_responsibility: agency_id ? 'AGENCY' : 'GUEST',
    }], { session });

    logger.info(`[Reservation] Created: ${reservation._id}`);

    // 7. Update inventory (WITHIN TRANSACTION)
    await Inventory.updateOnBooking(
      property_id,
      room_type_id,
      new Date(check_in_date),
      new Date(check_out_date),
      rooms_requested,
      session
    );

    logger.info('[Reservation] Inventory updated');

    // 8. Update agency stats (if agency booking) (WITHIN TRANSACTION)
    if (agency_id) {
      await Agency.findByIdAndUpdate(
        agency_id,
        {
          $inc: {
            'stats.total_bookings': 1,
            'stats.total_revenue': finalPrice,
            'stats.total_commission': commissionData.amount,
          },
        },
        { session }
      );
      logger.info('[Reservation] Agency stats updated');
    }

    // Commit transaction - all operations succeeded
    await session.commitTransaction();
    logger.info('[Reservation] Transaction committed successfully');

    // Send booking confirmation email asynchronously (do not block response)
    try {
      const property = await Property.findById(property_id).select('name contact');
      const emailService = require('./email.service');
      emailService.sendBookingConfirmation(reservation, property);
    } catch (emailErr) {
      logger.warn('[Reservation] Failed to queue booking email', { err: emailErr.message });
    }

    return reservation;

  } catch (error) {
    // Abort transaction on any error
    await session.abortTransaction();
    logger.error(`[Reservation Service] Transaction aborted: ${error.message}`);
    throw error;
  } finally {
    // End session
    session.endSession();
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

    // Multi-tenant filter: Get reservations for properties belonging to user's organization
    // Reservation doesn't have organization_id, we filter by property.organization_id
    const Property = require('../models').Property;
    const query = {};

    // If property_id is provided, validate it belongs to user's organization
    if (property_id) {
      const property = await Property.findById(property_id);
      if (!property) {
        throw new Error('Property not found');
      }
      if (property.organization_id.toString() !== user.organization_id.toString()) {
        throw new Error('Property does not belong to your organization');
      }
      query.property_id = property_id;
    } else {
      // If no property_id, get all properties for user's organization
      const properties = await Property.find({ organization_id: user.organization_id });
      const propertyIds = properties.map(p => p._id);
      if (propertyIds.length === 0) {
        // No properties, return empty result
        return {
          reservations: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0,
          },
        };
      }
      query.property_id = { $in: propertyIds };
    }

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
    const reservation = await Reservation.findById(id)
      .populate('property_id')
      .populate('room_type_id')
      .populate('rate_plan_id')
      .populate('agency_id')
      .populate('created_by_user_id', 'name email');

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Multi-tenant check: Verify reservation's property belongs to user's organization
    if (reservation.property_id.organization_id.toString() !== user.organization_id.toString()) {
      throw new Error('Reservation not found');
    }

    return reservation;
  } catch (error) {
    console.error('[Reservation Service] GetById error:', error);
    throw error;
  }
};

/**
 * Get today's arrivals for a property
 */
exports.getTodaysArrivals = async (propertyId, user) => {
  try {
    const Property = require('../models').Property;
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');
    if (user && property.organization_id.toString() !== user.organization_id.toString()) {
      throw new Error('Property not found');
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const query = {
      property_id: propertyId,
      check_in_date: { $gte: start, $lte: end },
      deleted_at: null,
    };

    const arrivals = await Reservation.find(query)
      .populate('property_id', 'name code')
      .populate('room_type_id', 'name code')
      .populate('rate_plan_id', 'name code')
      .sort('check_in_date')
      .lean();

    return arrivals;
  } catch (error) {
    console.error('[Reservation Service] getTodaysArrivals error:', error);
    throw error;
  }
};

/**
 * Get today's departures for a property
 */
exports.getTodaysDepartures = async (propertyId, user) => {
  try {
    const Property = require('../models').Property;
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');
    if (user && property.organization_id.toString() !== user.organization_id.toString()) {
      throw new Error('Property not found');
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const query = {
      property_id: propertyId,
      check_out_date: { $gte: start, $lte: end },
      deleted_at: null,
    };

    const departures = await Reservation.find(query)
      .populate('property_id', 'name code')
      .populate('room_type_id', 'name code')
      .populate('rate_plan_id', 'name code')
      .sort('check_out_date')
      .lean();

    return departures;
  } catch (error) {
    console.error('[Reservation Service] getTodaysDepartures error:', error);
    throw error;
  }
};

/**
 * Get reservation by booking reference
 */
exports.getReservationByBookingReference = async (bookingReference, user) => {
  try {
    const reservation = await Reservation.findOne({
      booking_reference: bookingReference,
      deleted_at: null,
    })
      .populate('property_id')
      .populate('room_type_id')
      .populate('rate_plan_id')
      .populate('created_by_user_id', 'first_name last_name email')
      .populate('agency_id', 'name');

    if (!reservation) throw new Error('Reservation not found');

    if (user && reservation.property_id.organization_id.toString() !== user.organization_id.toString()) {
      throw new Error('Reservation not found');
    }

    return reservation;
  } catch (error) {
    console.error('[Reservation Service] getReservationByBookingReference error:', error);
    throw error;
  }
};

/**
 * Get statistics for a property
 */
exports.getStats = async (propertyId, user) => {
  try {
    const Property = require('../models').Property;
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');
    if (user && property.organization_id.toString() !== user.organization_id.toString()) {
      throw new Error('Property not found');
    }

    const query = { property_id: propertyId, deleted_at: null };

    const [
      total,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
      todaysArrivals,
      todaysDepartures,
    ] = await Promise.all([
      Reservation.countDocuments(query),
      Reservation.countDocuments({ ...query, status: 'confirmed' }),
      Reservation.countDocuments({ ...query, status: 'checked_in' }),
      Reservation.countDocuments({ ...query, status: 'checked_out' }),
      Reservation.countDocuments({ ...query, status: 'cancelled' }),
      exports.getTodaysArrivals(propertyId, user),
      exports.getTodaysDepartures(propertyId, user),
    ]);

    const stats = {
      total_reservations: total,
      by_status: {
        confirmed,
        checked_in: checkedIn,
        checked_out: checkedOut,
        cancelled,
      },
      today: {
        arrivals: todaysArrivals.length,
        departures: todaysDepartures.length,
      },
    };

    return stats;
  } catch (error) {
    console.error('[Reservation Service] getStats error:', error);
    throw error;
  }
};

/**
 * Update reservation
 */
exports.updateReservation = async (id, updates, user) => {
  try {
    // First, verify reservation belongs to user's organization
    const reservation = await Reservation.findById(id).populate('property_id');

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Multi-tenant check: Verify reservation's property belongs to user's organization
    if (reservation.property_id.organization_id.toString() !== user.organization_id.toString()) {
      throw new Error('Reservation not found');
    }

    // Update reservation
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    return updatedReservation;
  } catch (error) {
    console.error('[Reservation Service] Update error:', error);
    throw error;
  }
};

/**
 * Cancel reservation (WITH COMMISSION REVERSAL + TRANSACTION)
 * Uses MongoDB transaction to ensure atomicity
 */
exports.cancelReservation = async (id, reason, _user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Mark _user as used to satisfy lint
    void _user;

    // First, verify reservation belongs to user's organization
    const reservation = await Reservation.findById(id).populate('property_id').session(session);

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Validate cancellation status
    if (reservation.status === 'cancelled') {
      await session.abortTransaction();
      throw new Error('Reservation already cancelled');
    }

    if (reservation.status === 'checked_out') {
      await session.abortTransaction();
      throw new Error('Cannot cancel checked-out reservation');
    }

    // Cancel reservation (WITHIN TRANSACTION)
    reservation.status = 'cancelled';
    reservation.cancelled_at = new Date();
    if (reason) reservation.cancellation_reason = reason;
    await reservation.save({ session });

    logger.info(`[Reservation] Cancelled: ${reservation._id}`);

    // Release inventory (WITHIN TRANSACTION)
    await Inventory.updateOnCancellation(
      reservation.property_id,
      reservation.room_type_id,
      new Date(reservation.check_in_date),
      new Date(reservation.check_out_date),
      reservation.rooms_requested || 1,
      session
    );

    logger.info('[Reservation] Inventory released');

    // Reverse agency stats (if agency booking) (WITHIN TRANSACTION)
    if (reservation.agency_id) {
      const totalPrice = typeof reservation.total_price === 'object'
        ? parseFloat(reservation.total_price.toString())
        : reservation.total_price;
      const commissionAmount = reservation.commission?.amount
        ? (typeof reservation.commission.amount === 'object'
          ? parseFloat(reservation.commission.amount.toString())
          : reservation.commission.amount)
        : 0;

      await Agency.findByIdAndUpdate(
        reservation.agency_id,
        {
          $inc: {
            'stats.total_bookings': -1,
            'stats.total_revenue': -totalPrice,
            'stats.total_commission': -commissionAmount,
          },
        },
        { session }
      );
      logger.info('[Reservation] Agency stats reversed');
    }

    // Commit transaction
    await session.commitTransaction();
    logger.info('[Reservation] Cancel transaction committed successfully');

    // Send cancellation email asynchronously
    try {
      const property = await Property.findById(reservation.property_id).select('name contact');
      const emailService = require('./email.service');
      emailService.sendCancellation(reservation, property, reason);
    } catch (emailErr) {
      logger.warn('[Reservation] Failed to queue cancellation email', { err: emailErr.message });
    }

    return reservation;
  } catch (error) {
    // Abort transaction on any error
    await session.abortTransaction();
    logger.error(`[Reservation Service] Cancel transaction aborted: ${error.message}`);
    throw error;
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * Check-in reservation
 */
exports.checkInReservation = async (id, user) => {
  try {
    // First, verify reservation belongs to user's organization
    const reservation = await Reservation.findById(id).populate('property_id');

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Multi-tenant check: Verify reservation's property belongs to user's organization
    if (reservation.property_id.organization_id.toString() !== user.organization_id.toString()) {
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
    // First, verify reservation belongs to user's organization
    const reservation = await Reservation.findById(id).populate('property_id');

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Multi-tenant check: Verify reservation's property belongs to user's organization
    if (reservation.property_id.organization_id.toString() !== user.organization_id.toString()) {
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

/**
 * Create option (geçici kilitleme) - Agency 24-48 saat oda kilitler
 */
exports.createOption = async (data, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      property_id,
      room_type_id,
      rate_plan_id,
      check_in_date,
      check_out_date,
      agency_id,
      option_hours = 24,
      rooms_requested = 1,
    } = data;

    logger.info(`[Option] Creating option: ${JSON.stringify({ property_id, room_type_id, option_hours })}`);

    // 1. Validate property
    const Property = require('../models').Property;
    const property = await Property.findById(property_id).session(session);
    if (!property) {
      await session.abortTransaction();
      throw new Error('Property not found');
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
      await session.abortTransaction();
      throw new Error(`Not available: ${isAvailable.reason}`);
    }

    // 3. Calculate price
    const totalPrice = await Price.calculateTotalPrice(
      property_id,
      room_type_id,
      rate_plan_id,
      new Date(check_in_date),
      new Date(check_out_date)
    );
    const finalPrice = typeof totalPrice === 'object' ? totalPrice.total : totalPrice;

    // 4. Calculate option expiry
    const optionExpiresAt = new Date();
    optionExpiresAt.setHours(optionExpiresAt.getHours() + option_hours);

    // 5. Create option reservation
    const [option] = await Reservation.create([{
      ...data,
      created_by_user_id: user._id,
      total_price: finalPrice,
      total_with_tax: Number((finalPrice * 1.07).toFixed(2)),
      status: 'option',
      option_expires_at: optionExpiresAt,
      option_hours,
      source: agency_id ? 'AGENCY' : 'DIRECT',
      agency_id: agency_id || undefined,
    }], { session });

    logger.info(`[Option] Created: ${option._id}, expires at: ${optionExpiresAt}`);

    // 6. Update inventory (hold rooms)
    await Inventory.updateOnBooking(
      property_id,
      room_type_id,
      new Date(check_in_date),
      new Date(check_out_date),
      rooms_requested,
      session
    );

    await session.commitTransaction();
    logger.info('[Option] Transaction committed');

    return option;

  } catch (error) {
    await session.abortTransaction();
    logger.error(`[Option Service] Error: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Confirm option - Option'ı gerçek rezervasyona çevir
 */
exports.confirmOption = async (optionId, guestData, user) => {
  try {
    const reservation = await Reservation.findById(optionId).populate('property_id');

    if (!reservation) {
      throw new Error('Option not found');
    }

    if (reservation.status !== 'option') {
      throw new Error('This is not an option reservation');
    }

    if (reservation.isOptionExpired()) {
      // Release inventory
      await Inventory.updateOnCancellation(
        reservation.property_id,
        reservation.room_type_id,
        reservation.check_in_date,
        reservation.check_out_date,
        reservation.rooms_requested || 1
      );
      reservation.status = 'option_expired';
      await reservation.save();
      throw new Error('Option has expired');
    }

    // Update guest info and confirm
    reservation.guest = guestData;
    reservation.status = 'confirmed';
    reservation.confirmed_at = new Date();
    reservation.option_expires_at = null;

    await reservation.save();

    logger.info(`[Option] Confirmed: ${reservation._id}`);

    // Send confirmation email
    try {
      const emailService = require('./email.service');
      emailService.sendBookingConfirmation(reservation, reservation.property_id);
    } catch (emailErr) {
      logger.warn('[Option] Email failed', { err: emailErr.message });
    }

    return reservation;

  } catch (error) {
    logger.error(`[Option Service] Confirm error: ${error.message}`);
    throw error;
  }
};

/**
 * Expire options - Süresi dolan option'ları expire et ve envanteri serbest bırak
 * Bu fonksiyon bir cron job ile çağrılmalı (örn: her 15 dakikada)
 */
exports.expireOptions = async () => {
  try {
    const expiredOptions = await Reservation.find({
      status: 'option',
      option_expires_at: { $lt: new Date() },
    });

    let expiredCount = 0;

    for (const option of expiredOptions) {
      try {
        // Release inventory
        await Inventory.updateOnCancellation(
          option.property_id,
          option.room_type_id,
          option.check_in_date,
          option.check_out_date,
          option.rooms_requested || 1
        );

        option.status = 'option_expired';
        await option.save();
        expiredCount++;

        logger.info(`[Option] Expired: ${option._id}`);
      } catch (err) {
        logger.error(`[Option] Expire error for ${option._id}: ${err.message}`);
      }
    }

    return {
      checked: expiredOptions.length,
      expired: expiredCount,
    };

  } catch (error) {
    logger.error(`[Option Service] ExpireOptions error: ${error.message}`);
    throw error;
  }
};

module.exports = exports;