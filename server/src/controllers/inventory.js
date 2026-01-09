/**
 * 📦 INVENTORY CONTROLLER
 * 
 * Real-time availability management
 * Features: CRUD, availability checks, bulk operations, sold tracking
 */

const BaseController = require('./base');
const { Inventory } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

class InventoryController extends BaseController {
  constructor() {
    super(Inventory, 'inventory');
    
    // Disable organization filtering (inventory filters by property)
    this.useOrganizationFilter = false;
    
    // Populate fields
    this.populateFields = 'property_id room_type_id';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Validate allotment
    if (data.allotment !== undefined && data.allotment < 0) {
      return 'Allotment cannot be negative';
    }

    // Validate sold
    if (data.sold !== undefined && data.sold < 0) {
      return 'Sold cannot be negative';
    }

    // Validate sold <= allotment
    if (data.sold > data.allotment) {
      return 'Sold cannot exceed allotment';
    }

    return null;
  };

  /**
   * 📅 GET FOR DATE RANGE
   * Get inventory for a specific date range
   */
  getForDateRange = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    const inventory = await Inventory.find({
      property_id: propertyId,
      room_type_id: roomTypeId,
      date: {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      },
      deleted_at: null
    })
      .populate('property_id', 'name code')
      .populate('room_type_id', 'name code')
      .sort('date');

    return res.success(inventory);
  });

  /**
   * ✅ CHECK AVAILABILITY
   * Check if rooms are available for booking
   */
  checkAvailability = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { check_in_date, check_out_date, rooms_requested = 1 } = req.query;

    if (!check_in_date || !check_out_date) {
      return res.badRequest('Check-in and check-out dates are required');
    }

    const availability = await Inventory.checkAvailability(
      propertyId,
      roomTypeId,
      new Date(check_in_date),
      new Date(check_out_date),
      parseInt(rooms_requested)
    );

    return res.success(availability);
  });

  /**
   * 📦 BULK UPDATE INVENTORY
   * Update inventory for a date range
   */
  bulkUpdate = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { start_date, end_date, updates } = req.body;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.badRequest('Updates object is required');
    }

    // Validate updates
    const validFields = ['allotment', 'stop_sell', 'min_stay', 'max_stay'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !validFields.includes(field));

    if (invalidFields.length > 0) {
      return res.badRequest({ message: `Invalid update fields: ${invalidFields.join(', ')}`, valid_fields: validFields });
    }

    const result = await Inventory.bulkUpdateInventory(
      propertyId,
      roomTypeId,
      new Date(start_date),
      new Date(end_date),
      updates
    );

    return res.success({
      upserted_count: result.upsertedCount,
      modified_count: result.modifiedCount,
      matched_count: result.matchedCount,
      date_range: {
        start_date: new Date(start_date),
        end_date: new Date(end_date)
      }
    }, { message: 'Inventory updated successfully' });
  });

  /**
   * ➕ INCREMENT SOLD
   * Increase sold count (used when creating reservation)
   */
  incrementSold = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { dates, quantity = 1 } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.badRequest('Dates array is required and cannot be empty');
    }

    const dateObjects = dates.map(d => new Date(d));

    await Inventory.incrementSold(
      propertyId,
      roomTypeId,
      dateObjects,
      parseInt(quantity)
    );

    return res.success(null, { message: `Sold count incremented by ${quantity} for ${dates.length} dates` });
  });

  /**
   * ➖ DECREMENT SOLD
   * Decrease sold count (used when cancelling reservation)
   */
  decrementSold = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { dates, quantity = 1 } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.badRequest('Dates array is required and cannot be empty');
    }

    const dateObjects = dates.map(d => new Date(d));

    await Inventory.decrementSold(
      propertyId,
      roomTypeId,
      dateObjects,
      parseInt(quantity)
    );

    return res.success(null, { message: `Sold count decremented by ${quantity} for ${dates.length} dates` });
  });

  /**
   * 🔒 TOGGLE STOP SELL
   * Enable or disable stop sell
   */
  toggleStopSell = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { dates, stop_sell } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.badRequest('Dates array is required and cannot be empty');
    }

    if (stop_sell === undefined) {
      return res.badRequest('stop_sell value is required');
    }

    const result = await Inventory.updateMany(
      {
        property_id: propertyId,
        room_type_id: roomTypeId,
        date: { $in: dates.map(d => new Date(d)) },
        deleted_at: null
      },
      {
        $set: { stop_sell: Boolean(stop_sell) }
      }
    );

    return res.success({ modified_count: result.modifiedCount, stop_sell: Boolean(stop_sell) }, { message: `Stop sell ${stop_sell ? 'enabled' : 'disabled'} for ${dates.length} dates` });
  });

  /**
   * 🎯 GET FOR SPECIFIC DATE
   * Get inventory for a specific date
   */
  getForDate = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.badRequest('Date is required');
    }

    const inventory = await Inventory.findOne({
      property_id: propertyId,
      room_type_id: roomTypeId,
      date: new Date(date),
      deleted_at: null
    })
      .populate('property_id', 'name code')
      .populate('room_type_id', 'name code');

    if (!inventory) {
      return res.notFound('Inventory not found for this date');
    }

    return res.success(inventory);
  });

  /**
   * 📊 GET AVAILABILITY CALENDAR
   * Get availability overview for a month
   */
  getAvailabilityCalendar = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.badRequest('Year and month are required');
    }

    // Get first and last day of month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const inventory = await Inventory.find({
      property_id: propertyId,
      room_type_id: roomTypeId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      deleted_at: null
    }).sort('date');

    // Transform to calendar format
    const calendar = inventory.map(inv => ({
      date: inv.date,
      allotment: inv.allotment,
      sold: inv.sold,
      available: inv.available,
      stop_sell: inv.stop_sell,
      is_available: inv.available > 0 && !inv.stop_sell
    }));

    return res.success({ year: parseInt(year), month: parseInt(month), calendar });
  });
}

// Export controller instance
module.exports = new InventoryController();