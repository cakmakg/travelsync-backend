/**
 * 💵 PRICE CONTROLLER
 * 
 * Daily rate management
 * Features: CRUD, bulk operations, price suggestions, date range queries
 */

const BaseController = require('./base');
const { Price } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

class PriceController extends BaseController {
  constructor() {
    super(Price, 'price');
    
    // Populate fields
    this.populateFields = 'property_id room_type_id rate_plan_id';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Validate amount
    if (data.amount && data.amount < 0) {
      return 'Amount cannot be negative';
    }

    // Validate source
    const validSources = ['MANUAL', 'BULK_UPLOAD', 'AI_SUGGESTION', 'CHANNEL_MANAGER'];
    if (data.source && !validSources.includes(data.source)) {
      return `Invalid source. Must be one of: ${validSources.join(', ')}`;
    }

    return null;
  };

  /**
   * 📅 GET FOR DATE RANGE
   * Get prices for a specific date range
   */
  getForDateRange = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId, ratePlanId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    const prices = await Price.findForDateRange(
      propertyId,
      roomTypeId,
      ratePlanId,
      new Date(start_date),
      new Date(end_date)
    );

    return res.success(prices);
  });

  /**
   * 📊 GET PRICE SUMMARY
   * Get price statistics for a date range
   */
  getPriceSummary = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId, ratePlanId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    const summary = await Price.getPriceSummary(
      propertyId,
      roomTypeId,
      ratePlanId,
      new Date(start_date),
      new Date(end_date)
    );

    return res.success(summary);
  });

  /**
   * 📦 BULK UPSERT PRICES
   * Create or update multiple prices at once
   */
  bulkUpsert = asyncHandler(async (req, res) => {
    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.badRequest('Prices array is required and cannot be empty');
    }

    // Validate each price
    for (const price of prices) {
      if (!price.property_id || !price.room_type_id || !price.rate_plan_id || !price.date || price.amount === undefined) {
        return res.badRequest('Each price must have property_id, room_type_id, rate_plan_id, date, and amount');
      }
    }

    const result = await Price.bulkUpsertPrices(prices);

    return res.success({
      created: result.created || 0,
      updated: result.updated || 0,
      total: result.total || 0
    }, { message: 'Prices updated successfully' });
  });

  /**
   * 📅 BULK UPDATE DATE RANGE
   * Update prices for a date range
   */
  bulkUpdateDateRange = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId, ratePlanId } = req.params;
    const { start_date, end_date, amount, is_available } = req.body;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    if (amount === undefined && is_available === undefined) {
      return res.badRequest('At least amount or is_available must be provided');
    }

    // Generate prices for date range
    const prices = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const priceData = {
        property_id: propertyId,
        room_type_id: roomTypeId,
        rate_plan_id: ratePlanId,
        date: new Date(d),
        source: 'MANUAL'
      };

      if (amount !== undefined) priceData.amount = amount;
      if (is_available !== undefined) priceData.is_available = is_available;

      prices.push(priceData);
    }

    const result = await Price.bulkUpsertPrices(prices);

    return res.success({
      updated_count: result.modifiedCount + result.upsertedCount,
      date_range: { start_date: startDate, end_date: endDate }
    }, { message: 'Prices updated successfully for date range' });
  });

  /**
   * 🎯 GET PRICE FOR SPECIFIC DATE
   * Get price for a specific date
   */
  getForDate = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId, ratePlanId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.badRequest('Date is required');
    }

    const price = await Price.findOne({
      property_id: propertyId,
      room_type_id: roomTypeId,
      rate_plan_id: ratePlanId,
      date: new Date(date),
      deleted_at: null
    })
      .populate('property_id', 'name code')
      .populate('room_type_id', 'name code')
      .populate('rate_plan_id', 'name code');

    if (!price) {
      return res.notFound('Price not found for this date');
    }

    return res.success(price);
  });

  /**
   * 🏨 GET BY PROPERTY
   * Get all prices for a property (with pagination)
   */
  getByProperty = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { 
      page = 1, 
      limit = 100,
      start_date,
      end_date,
      room_type_id,
      rate_plan_id
    } = req.query;

    const query = {
      property_id: propertyId,
      deleted_at: null
    };

    // Add filters
    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    if (room_type_id) query.room_type_id = room_type_id;
    if (rate_plan_id) query.rate_plan_id = rate_plan_id;

    const skip = (page - 1) * limit;

    const [prices, total] = await Promise.all([
      Price.find(query)
        .populate('room_type_id', 'name code')
        .populate('rate_plan_id', 'name code')
        .sort('date')
        .skip(skip)
        .limit(parseInt(limit)),
      Price.countDocuments(query)
    ]);

    return res.success({ items: prices, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) } });
  });

  /**
   * 🗑️ DELETE DATE RANGE
   * Delete prices for a date range
   */
  deleteDateRange = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId, ratePlanId } = req.params;
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res.badRequest('Start date and end date are required');
    }

    const result = await Price.updateMany(
      {
        property_id: propertyId,
        room_type_id: roomTypeId,
        rate_plan_id: ratePlanId,
        date: {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        },
        deleted_at: null
      },
      {
        $set: { deleted_at: new Date() }
      }
    );

    return res.success({ deleted_count: result.modifiedCount, date_range: { start_date: new Date(start_date), end_date: new Date(end_date) } }, { message: 'Prices deleted successfully for date range' });
  });
}

// Export controller instance
module.exports = new PriceController();