/**
 * 📦 INVENTORY CONTROLLER
 * 
 * Real-time availability management
 * Features: CRUD, availability checks, bulk operations, sold tracking
 */

const BaseController = require('./base');
const { Inventory } = require('../models');

class InventoryController extends BaseController {
  constructor() {
    super(Inventory, 'inventory');
    
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
  getForDateRange = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' }
        });
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

      res.status(200).json({
        success: true,
        data: inventory
      });
    } catch (error) {
      console.error('[Inventory] Get for date range error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get inventory',
          details: error.message
        }
      });
    }
  };

  /**
   * ✅ CHECK AVAILABILITY
   * Check if rooms are available for booking
   */
  checkAvailability = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { check_in_date, check_out_date, rooms_requested = 1 } = req.query;

      if (!check_in_date || !check_out_date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Check-in and check-out dates are required' }
        });
      }

      const availability = await Inventory.checkAvailability(
        propertyId,
        roomTypeId,
        new Date(check_in_date),
        new Date(check_out_date),
        parseInt(rooms_requested)
      );

      res.status(200).json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('[Inventory] Check availability error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to check availability',
          details: error.message
        }
      });
    }
  };

  /**
   * 📦 BULK UPDATE INVENTORY
   * Update inventory for a date range
   */
  bulkUpdate = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { start_date, end_date, updates } = req.body;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' }
        });
      }

      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Updates object is required' }
        });
      }

      // Validate updates
      const validFields = ['allotment', 'stop_sell', 'min_stay', 'max_stay'];
      const updateFields = Object.keys(updates);
      const invalidFields = updateFields.filter(field => !validFields.includes(field));

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: { 
            message: `Invalid update fields: ${invalidFields.join(', ')}`,
            valid_fields: validFields
          }
        });
      }

      const result = await Inventory.bulkUpdateInventory(
        propertyId,
        roomTypeId,
        new Date(start_date),
        new Date(end_date),
        updates
      );

      res.status(200).json({
        success: true,
        data: {
          upserted_count: result.upsertedCount,
          modified_count: result.modifiedCount,
          matched_count: result.matchedCount,
          date_range: {
            start_date: new Date(start_date),
            end_date: new Date(end_date)
          }
        },
        message: 'Inventory updated successfully'
      });
    } catch (error) {
      console.error('[Inventory] Bulk update error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update inventory',
          details: error.message
        }
      });
    }
  };

  /**
   * ➕ INCREMENT SOLD
   * Increase sold count (used when creating reservation)
   */
  incrementSold = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { dates, quantity = 1 } = req.body;

      if (!Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Dates array is required and cannot be empty' }
        });
      }

      const dateObjects = dates.map(d => new Date(d));

      await Inventory.incrementSold(
        propertyId,
        roomTypeId,
        dateObjects,
        parseInt(quantity)
      );

      res.status(200).json({
        success: true,
        message: `Sold count incremented by ${quantity} for ${dates.length} dates`
      });
    } catch (error) {
      console.error('[Inventory] Increment sold error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to increment sold count',
          details: error.message
        }
      });
    }
  };

  /**
   * ➖ DECREMENT SOLD
   * Decrease sold count (used when cancelling reservation)
   */
  decrementSold = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { dates, quantity = 1 } = req.body;

      if (!Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Dates array is required and cannot be empty' }
        });
      }

      const dateObjects = dates.map(d => new Date(d));

      await Inventory.decrementSold(
        propertyId,
        roomTypeId,
        dateObjects,
        parseInt(quantity)
      );

      res.status(200).json({
        success: true,
        message: `Sold count decremented by ${quantity} for ${dates.length} dates`
      });
    } catch (error) {
      console.error('[Inventory] Decrement sold error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to decrement sold count',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔒 TOGGLE STOP SELL
   * Enable or disable stop sell
   */
  toggleStopSell = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { dates, stop_sell } = req.body;

      if (!Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Dates array is required and cannot be empty' }
        });
      }

      if (stop_sell === undefined) {
        return res.status(400).json({
          success: false,
          error: { message: 'stop_sell value is required' }
        });
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

      res.status(200).json({
        success: true,
        data: {
          modified_count: result.modifiedCount,
          stop_sell: Boolean(stop_sell)
        },
        message: `Stop sell ${stop_sell ? 'enabled' : 'disabled'} for ${dates.length} dates`
      });
    } catch (error) {
      console.error('[Inventory] Toggle stop sell error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to toggle stop sell',
          details: error.message
        }
      });
    }
  };

  /**
   * 🎯 GET FOR SPECIFIC DATE
   * Get inventory for a specific date
   */
  getForDate = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Date is required' }
        });
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
        return res.status(404).json({
          success: false,
          error: { message: 'Inventory not found for this date' }
        });
      }

      res.status(200).json({
        success: true,
        data: inventory
      });
    } catch (error) {
      console.error('[Inventory] Get for date error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get inventory',
          details: error.message
        }
      });
    }
  };

  /**
   * 📊 GET AVAILABILITY CALENDAR
   * Get availability overview for a month
   */
  getAvailabilityCalendar = async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          error: { message: 'Year and month are required' }
        });
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

      res.status(200).json({
        success: true,
        data: {
          year: parseInt(year),
          month: parseInt(month),
          calendar
        }
      });
    } catch (error) {
      console.error('[Inventory] Get availability calendar error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get availability calendar',
          details: error.message
        }
      });
    }
  };
}

// Export controller instance
module.exports = new InventoryController();