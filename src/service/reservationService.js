/**
 * 🎫 RESERVATION SERVICE
 * 
 * Complex business logic for reservations
 * Features: Availability check, price calculation, inventory management
 */

const { Reservation, Inventory, Price, RoomType, RatePlan, AuditLog } = require('../models');

class ReservationService {
  /**
   * ✅ CHECK AVAILABILITY
   * Check if rooms are available for booking
   */
  async checkAvailability(propertyId, roomTypeId, checkInDate, checkOutDate, roomsNeeded = 1) {
    try {
      // Check inventory availability
      const availability = await Inventory.checkAvailability(
        propertyId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        roomsNeeded
      );

      if (!availability.available) {
        return {
          available: false,
          reason: availability.reason,
          details: availability
        };
      }

      // Check room type
      const roomType = await RoomType.findOne({
        _id: roomTypeId,
        property_id: propertyId,
        is_active: true,
        is_bookable: true,
        deleted_at: null
      });

      if (!roomType) {
        return {
          available: false,
          reason: 'Room type not available for booking'
        };
      }

      return {
        available: true,
        room_type: roomType,
        inventory_details: availability
      };
    } catch (error) {
      console.error('[ReservationService] Check availability error:', error);
      throw error;
    }
  }

  /**
   * 💰 CALCULATE TOTAL PRICE
   * Calculate total price for a reservation
   */
  async calculateTotalPrice(propertyId, roomTypeId, ratePlanId, checkInDate, checkOutDate) {
    try {
      // Get all prices for date range
      const prices = await Price.findForDateRange(
        propertyId,
        roomTypeId,
        ratePlanId,
        checkInDate,
        checkOutDate
      );

      // Calculate nights
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

      // Check if we have prices for all nights
      if (prices.length !== nights) {
        throw new Error(`Missing prices for some dates. Expected ${nights} nights, found ${prices.length} prices`);
      }

      // Calculate total
      let totalPrice = 0;
      const priceBreakdown = [];

      for (const price of prices) {
        if (!price.is_available) {
          throw new Error(`Price not available for date: ${price.date}`);
        }

        totalPrice += price.amount;
        priceBreakdown.push({
          date: price.date,
          amount: price.amount,
          currency: price.currency
        });
      }

      // Get rate plan for tax calculation
      const ratePlan = await RatePlan.findById(ratePlanId);
      if (!ratePlan) {
        throw new Error('Rate plan not found');
      }

      // Calculate tax (example: 7% VAT)
      const taxRate = 0.07;
      const taxAmount = totalPrice * taxRate;
      const totalWithTax = totalPrice + taxAmount;

      return {
        total_price: totalPrice,
        tax_amount: taxAmount,
        tax_rate: taxRate,
        total_with_tax: totalWithTax,
        currency: prices[0]?.currency || 'EUR',
        nights,
        price_breakdown: priceBreakdown
      };
    } catch (error) {
      console.error('[ReservationService] Calculate total price error:', error);
      throw error;
    }
  }

  /**
   * 🎫 CREATE RESERVATION
   * Create a new reservation with all validations
   */
  async createReservation(data, userId) {
    try {
      const {
        property_id,
        room_type_id,
        rate_plan_id,
        check_in_date,
        check_out_date,
        guests,
        guest
      } = data;

      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);

      // 1. Check availability
      const availability = await this.checkAvailability(
        property_id,
        room_type_id,
        checkIn,
        checkOut,
        1
      );

      if (!availability.available) {
        throw new Error(availability.reason || 'Room not available');
      }

      // 2. Calculate price
      const pricing = await this.calculateTotalPrice(
        property_id,
        room_type_id,
        rate_plan_id,
        checkIn,
        checkOut
      );

      // 3. Create reservation
      const reservation = await Reservation.create({
        property_id,
        room_type_id,
        rate_plan_id,
        created_by_user_id: userId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests,
        guest,
        total_price: pricing.total_price,
        total_with_tax: pricing.total_with_tax,
        currency: pricing.currency,
        status: 'confirmed',
        source: data.source || 'DIRECT'
      });

      // 4. Update inventory (increment sold)
      const dates = [];
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      await Inventory.incrementSold(property_id, room_type_id, dates, 1);

      // 5. Audit log
      await AuditLog.logAction({
        organization_id: reservation.organization_id,
        user_id: userId,
        action: 'CREATE',
        entity_type: 'reservation',
        entity_id: reservation._id,
        changes: {
          before: null,
          after: reservation.toObject()
        },
        description: `Reservation created: ${reservation.booking_reference}`,
        ip_address: data.ip_address,
        user_agent: data.user_agent
      });

      return {
        reservation,
        pricing
      };
    } catch (error) {
      console.error('[ReservationService] Create reservation error:', error);
      throw error;
    }
  }

  /**
   * ❌ CANCEL RESERVATION
   * Cancel a reservation and restore inventory
   */
  async cancelReservation(reservationId, userId, reason, ipAddress, userAgent) {
    try {
      // 1. Find reservation
      const reservation = await Reservation.findById(reservationId);
      
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status === 'cancelled') {
        throw new Error('Reservation is already cancelled');
      }

      if (reservation.status === 'checked_out') {
        throw new Error('Cannot cancel a checked-out reservation');
      }

      // Store before state
      const before = reservation.toObject();

      // 2. Update reservation status
      await reservation.cancel(userId, reason);

      // 3. Restore inventory (decrement sold)
      const dates = [];
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);

      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      await Inventory.decrementSold(
        reservation.property_id,
        reservation.room_type_id,
        dates,
        1
      );

      // 4. Audit log
      await AuditLog.logAction({
        organization_id: reservation.organization_id,
        user_id: userId,
        action: 'CANCEL',
        entity_type: 'reservation',
        entity_id: reservation._id,
        changes: {
          before,
          after: reservation.toObject()
        },
        description: `Reservation cancelled: ${reservation.booking_reference}. Reason: ${reason}`,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return reservation;
    } catch (error) {
      console.error('[ReservationService] Cancel reservation error:', error);
      throw error;
    }
  }

  /**
   * 🏨 CHECK-IN RESERVATION
   * Check-in a confirmed reservation
   */
  async checkInReservation(reservationId, userId, ipAddress, userAgent) {
    try {
      const reservation = await Reservation.findById(reservationId);
      
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'confirmed') {
        throw new Error(`Cannot check-in reservation with status: ${reservation.status}`);
      }

      // Store before state
      const before = reservation.toObject();

      // Update status
      reservation.status = 'checked_in';
      await reservation.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: reservation.organization_id,
        user_id: userId,
        action: 'CHECK_IN',
        entity_type: 'reservation',
        entity_id: reservation._id,
        changes: {
          before,
          after: reservation.toObject()
        },
        description: `Guest checked in: ${reservation.booking_reference}`,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return reservation;
    } catch (error) {
      console.error('[ReservationService] Check-in reservation error:', error);
      throw error;
    }
  }

  /**
   * 🏁 CHECK-OUT RESERVATION
   * Check-out a checked-in reservation
   */
  async checkOutReservation(reservationId, userId, ipAddress, userAgent) {
    try {
      const reservation = await Reservation.findById(reservationId);
      
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'checked_in') {
        throw new Error(`Cannot check-out reservation with status: ${reservation.status}`);
      }

      // Store before state
      const before = reservation.toObject();

      // Update status
      reservation.status = 'checked_out';
      await reservation.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: reservation.organization_id,
        user_id: userId,
        action: 'CHECK_OUT',
        entity_type: 'reservation',
        entity_id: reservation._id,
        changes: {
          before,
          after: reservation.toObject()
        },
        description: `Guest checked out: ${reservation.booking_reference}`,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return reservation;
    } catch (error) {
      console.error('[ReservationService] Check-out reservation error:', error);
      throw error;
    }
  }

  /**
   * 📅 GET TODAY'S ARRIVALS
   * Get reservations checking in today
   */
  async getTodaysArrivals(propertyId) {
    try {
      return await Reservation.getTodaysArrivals(propertyId);
    } catch (error) {
      console.error('[ReservationService] Get todays arrivals error:', error);
      throw error;
    }
  }

  /**
   * 🏁 GET TODAY'S DEPARTURES
   * Get reservations checking out today
   */
  async getTodaysDepartures(propertyId) {
    try {
      return await Reservation.getTodaysDepartures(propertyId);
    } catch (error) {
      console.error('[ReservationService] Get todays departures error:', error);
      throw error;
    }
  }
}

module.exports = new ReservationService();