"use strict";
/* -------------------------------------------------------
    TravelSync - Price Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');;

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
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative'],
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'EUR',
      minlength: [3, 'Currency code must be 3 characters'],
      maxlength: [3, 'Currency code must be 3 characters'],
    },

    // Source of the price
    source: {
      type: String,
      enum: ['MANUAL', 'AI', 'IMPORT', 'DERIVED'],
      default: 'MANUAL',
      required: true,
    },

    // AI suggestion metadata
    ai_suggestion: {
      suggested_amount: mongoose.Schema.Types.Decimal128,
      confidence: {
        type: Number,
        min: [0, 'Confidence must be between 0 and 1'],
        max: [1, 'Confidence must be between 0 and 1'],
      },
      reasoning: String,
      applied_at: Date,
    },

    // Overrides
    is_available: {
      type: Boolean,
      default: true,
      comment: 'If false, room cannot be booked for this date',
    },

    // Minimum stay requirement for this specific date
    min_nights_override: {
      type: Number,
      default: null,
      min: [1, 'Must be at least 1 night'],
    },

    // Metadata
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    collection: 'prices',
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Compound unique index: One price per room type + rate plan + date
PriceSchema.index(
  { property_id: 1, room_type_id: 1, rate_plan_id: 1, date: 1 },
  { unique: true }
);
PriceSchema.index({ date: 1 });
PriceSchema.index({ source: 1 });
PriceSchema.index({ is_available: 1 });

// Methods
PriceSchema.methods.getAmountWithTax = function (taxRate) {
  const amount = parseFloat(this.amount.toString());
  return amount * (1 + taxRate / 100);
};

PriceSchema.methods.applySuggestion = function () {
  if (this.ai_suggestion && this.ai_suggestion.suggested_amount) {
    this.amount = this.ai_suggestion.suggested_amount;
    this.source = 'AI';
    this.ai_suggestion.applied_at = new Date();
    return this.save();
  }
  throw new Error('No AI suggestion available');
};

// Statics
PriceSchema.statics.findForDateRange = function (
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
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });
};

PriceSchema.statics.calculateTotalPrice = async function (
  propertyId,
  roomTypeId,
  ratePlanId,
  checkInDate,
  checkOutDate
) {
  const prices = await this.findForDateRange(
    propertyId,
    roomTypeId,
    ratePlanId,
    checkInDate,
    checkOutDate
  );

  let total = 0;
  prices.forEach((price) => {
    // Don't include check-out date (hotel standard)
    if (price.date.toDateString() !== new Date(checkOutDate).toDateString()) {
      total += parseFloat(price.amount.toString());
    }
  });

  return total;
};

PriceSchema.statics.bulkUpdatePrices = async function (
  propertyId,
  roomTypeId,
  ratePlanId,
  startDate,
  endDate,
  amount,
  source = 'MANUAL'
) {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        property_id: propertyId,
        room_type_id: roomTypeId,
        rate_plan_id: ratePlanId,
        date: date,
      },
      update: {
        $set: {
          amount: amount,
          source: source,
          updated_at: new Date(),
        },
      },
      upsert: true,
    },
  }));

  return this.bulkWrite(bulkOps);
};

module.exports = mongoose.model('Price', PriceSchema);