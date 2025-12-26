"use strict";
/* -------------------------------------------------------
    TravelSync - Price Model (TIMEZONE FIXED)
------------------------------------------------------- */

const { mongoose } = require('../config/database');
const logger = require('../config/logger');

const PriceSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },

    room_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type ID is required'],
      index: true,
    },

    rate_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatePlan',
      required: [true, 'Rate plan ID is required'],
      index: true,
    },

    date: {
      type: Date,
      required: [true, 'Date is required'],
      // Index defined below in schema.index()
    },

    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative'],
    },

    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      default: 'EUR',
      enum: {
        values: ['EUR', 'USD', 'GBP', 'TRY'],
        message: '{VALUE} is not a supported currency',
      },
    },

    source: {
      type: String,
      enum: ['MANUAL', 'SYSTEM', 'CHANNEL_MANAGER', 'API'],
      default: 'MANUAL',
      index: true,
    },

    is_available: {
      type: Boolean,
      default: true,
    },

    // Soft delete
    deleted_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    collection: 'prices',
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

// Compound unique index
PriceSchema.index(
  {
    property_id: 1,
    room_type_id: 1,
    rate_plan_id: 1,
    date: 1,
  },
  { unique: true }
);

// Query optimization indexes (date included in compound indexes)
PriceSchema.index({ property_id: 1, date: 1 });
PriceSchema.index({ room_type_id: 1, date: 1 });
PriceSchema.index({ rate_plan_id: 1, date: 1 });

// ============================================
// STATIC METHOD: Calculate Total Price (TIMEZONE FIXED)
// ============================================
PriceSchema.statics.calculateTotalPrice = async function (
  propertyId,
  roomTypeId,
  ratePlanId,
  startDate,
  endDate,
  rooms = 1
) {
  const dates = [];
  
  // Parse dates and work in UTC to avoid timezone issues
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to noon UTC to avoid DST and timezone shifts
  start.setUTCHours(12, 0, 0, 0);
  end.setUTCHours(12, 0, 0, 0);

  // Generate date array (check-in to check-out, excluding check-out day)
  const currentDate = new Date(start);
  
  while (currentDate < end) {
    // Create date at midnight UTC for MongoDB query
    const dateForQuery = new Date(currentDate);
    dateForQuery.setUTCHours(0, 0, 0, 0);
    dates.push(dateForQuery);
    
    // Increment by 1 day using UTC methods
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  if (dates.length === 0) {
    throw new Error('Invalid date range: check-in must be before check-out');
  }

  logger.debug(`[Price] Searching for dates: ${dates.map(d => d.toISOString().split('T')[0]).join(',')}`);

  // Find prices for all dates
  const prices = await this.find({
    property_id: propertyId,
    room_type_id: roomTypeId,
    rate_plan_id: ratePlanId,
    date: { $in: dates },
    is_available: true,
  }).lean();

  logger.debug(`[Price] Found: ${prices.length} / ${dates.length}`);

  // Check if all dates have prices
  if (prices.length !== dates.length) {
    const foundDates = prices.map(p => p.date.toISOString().split('T')[0]);
    const missingDates = dates
      .filter(d => !foundDates.includes(d.toISOString().split('T')[0]))
      .map(d => d.toISOString().split('T')[0]);
    
    logger.warn(`[Price] Missing dates: ${missingDates.join(',')}`);
    throw new Error(`Price not found for dates: ${missingDates.join(', ')}`);
  }

  // Calculate total
  const subtotal = prices.reduce((sum, price) => sum + (price.amount || 0), 0);
  const total = subtotal * rooms;

  logger.debug(`[Price] Total calculated: ${total}`);

  return {
    total,
    subtotal,
    rooms,
    nights: dates.length,
    currency: prices[0]?.currency || 'EUR',
    daily_prices: prices.map(p => ({
      date: p.date,
      amount: p.amount,
    })),
  };
};

/**
 * Find prices for date range
 */
PriceSchema.statics.findForDateRange = async function(
  propertyId,
  roomTypeId,
  ratePlanId,
  startDate,
  endDate
) {
  return this.find({
    property_id: propertyId,
    room_type_id: roomTypeId,
    rate_plan_id: ratePlanId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    deleted_at: null
  }).sort({ date: 1 });
};

/**
 * Bulk upsert prices
 */
PriceSchema.statics.bulkUpsertPrices = async function(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error('Prices array is required and cannot be empty');
  }

  const bulkOps = prices.map(price => ({
    updateOne: {
      filter: {
        property_id: price.property_id,
        room_type_id: price.room_type_id,
        rate_plan_id: price.rate_plan_id,
        date: new Date(price.date),
        deleted_at: null
      },
      update: {
        $set: {
          amount: price.amount,
          currency: price.currency || 'EUR',
          source: price.source || 'MANUAL',
          is_available: price.is_available !== undefined ? price.is_available : true,
          updatedAt: new Date()
        },
        $setOnInsert: {
          property_id: price.property_id,
          room_type_id: price.room_type_id,
          rate_plan_id: price.rate_plan_id,
          date: new Date(price.date),
          createdAt: new Date()
        }
      },
      upsert: true
    }
  }));

  const result = await this.bulkWrite(bulkOps);

  return {
    created: result.upsertedCount || 0,
    updated: result.modifiedCount || 0,
    total: prices.length
  };
};

/**
 * Get price for specific date
 */
PriceSchema.statics.getPriceForDate = async function(
  propertyId,
  roomTypeId,
  ratePlanId,
  date
) {
  return this.findOne({
    property_id: propertyId,
    room_type_id: roomTypeId,
    rate_plan_id: ratePlanId,
    date: new Date(date),
    deleted_at: null
  });
};

/**
 * Delete prices for date range (soft delete)
 */
PriceSchema.statics.deletePricesByDateRange = async function(
  propertyId,
  roomTypeId,
  ratePlanId,
  startDate,
  endDate
) {
  return this.updateMany(
    {
      property_id: propertyId,
      room_type_id: roomTypeId,
      rate_plan_id: ratePlanId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      deleted_at: null
    },
    {
      $set: {
        deleted_at: new Date(),
        updatedAt: new Date()
      }
    }
  );
};

/**
 * Get prices by property
 */
PriceSchema.statics.findByProperty = function(propertyId, filters = {}) {
  return this.find({
    property_id: propertyId,
    deleted_at: null,
    ...filters
  }).sort({ date: 1 });
};

/**
 * Get prices by room type
 */
PriceSchema.statics.findByRoomType = function(roomTypeId, filters = {}) {
  return this.find({
    room_type_id: roomTypeId,
    deleted_at: null,
    ...filters
  }).sort({ date: 1 });
};

/**
 * Get prices by rate plan
 */
PriceSchema.statics.findByRatePlan = function(ratePlanId, filters = {}) {
  return this.find({
    rate_plan_id: ratePlanId,
    deleted_at: null,
    ...filters
  }).sort({ date: 1 });
};

module.exports = mongoose.model('Price', PriceSchema);