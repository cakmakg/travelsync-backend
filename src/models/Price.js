"use strict";
/* -------------------------------------------------------
    TravelSync - Price Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');

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
      index: true,
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

// Compound unique index - one price per property/room/rate/date combination
PriceSchema.index(
  {
    property_id: 1,
    room_type_id: 1,
    rate_plan_id: 1,
    date: 1,
  },
  { unique: true }
);

// Query optimization indexes
PriceSchema.index({ property_id: 1, date: 1 });
PriceSchema.index({ room_type_id: 1, date: 1 });
PriceSchema.index({ rate_plan_id: 1, date: 1 });

// ============================================
// STATIC METHODS
// ============================================

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
 * Bulk upsert prices (create or update multiple prices)
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