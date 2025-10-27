"use strict";
/* -------------------------------------------------------
    TravelSync - RatePlan Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const RatePlanSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      required: [true, 'Rate plan code is required'],
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },

    name: {
      type: String,
      trim: true,
      required: [true, 'Rate plan name is required'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Rate type
    rate_type: {
      type: String,
      enum: ['public', 'package', 'corporate', 'promo', 'group'],
      default: 'public',
      required: true,
    },

    // Meal plan
    meal_plan: {
      type: String,
      enum: ['RO', 'BB', 'HB', 'FB', 'AI'],
      required: [true, 'Meal plan is required'],
      default: 'RO',
    },

    // Cancellation policy
    cancellation_policy: {
      type: {
        type: String,
        enum: ['flexible', 'moderate', 'strict', 'non_refundable'],
        required: true,
        default: 'flexible',
      },
      free_cancellation_until: {
        type: Number,
        default: 1,
        min: [0, 'Cannot be negative'],
        comment: 'Days before check-in',
      },
      penalty_percentage: {
        type: Number,
        default: 100,
        min: [0, 'Cannot be negative'],
        max: [100, 'Cannot exceed 100%'],
        comment: 'Penalty if cancelled after free period',
      },
      no_show_penalty: {
        type: Number,
        default: 100,
        min: [0, 'Cannot be negative'],
        max: [100, 'Cannot exceed 100%'],
      },
    },

    // Derived rate plan (e.g., Non-refundable derived from BAR)
    is_derived: {
      type: Boolean,
      default: false,
    },

    base_rate_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatePlan',
      default: null,
      comment: 'If derived, reference to base rate plan',
    },

    markup_percentage: {
      type: Number,
      default: 0,
      comment: 'Positive for markup, negative for discount (e.g., -10 for 10% off)',
    },

    // Restrictions
    min_nights: {
      type: Number,
      default: 1,
      min: [1, 'Minimum nights must be at least 1'],
    },

    max_nights: {
      type: Number,
      default: null,
      min: [1, 'Maximum nights must be at least 1'],
    },

    min_advance_booking: {
      type: Number,
      default: 0,
      min: [0, 'Cannot be negative'],
      comment: 'Minimum days before check-in to book',
    },

    max_advance_booking: {
      type: Number,
      default: 365,
      min: [1, 'Must be at least 1 day'],
      comment: 'Maximum days before check-in to book',
    },

    // Validity period
    valid_from: {
      type: Date,
      default: null,
    },

    valid_until: {
      type: Date,
      default: null,
    },

    // Description
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Terms and conditions
    terms: {
      type: String,
      maxlength: [2000, 'Terms cannot exceed 2000 characters'],
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    is_public: {
      type: Boolean,
      default: true,
      comment: 'If false, rate plan is for internal/special use only',
    },

    // Metadata
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    collection: 'rate_plans',
    timestamps: true,
  }
);

// Compound unique index: code must be unique within property
RatePlanSchema.index({ property_id: 1, code: 1 }, { unique: true });
RatePlanSchema.index({ is_active: 1 });
RatePlanSchema.index({ is_public: 1 });
RatePlanSchema.index({ rate_type: 1 });
RatePlanSchema.index({ meal_plan: 1 });

// Virtual: Prices
RatePlanSchema.virtual('prices', {
  ref: 'Price',
  localField: '_id',
  foreignField: 'rate_plan_id',
});

// Methods
RatePlanSchema.methods.isValidForDate = function (date) {
  if (!this.valid_from && !this.valid_until) return true;
  
  const checkDate = new Date(date);
  const validFrom = this.valid_from ? new Date(this.valid_from) : null;
  const validUntil = this.valid_until ? new Date(this.valid_until) : null;

  if (validFrom && checkDate < validFrom) return false;
  if (validUntil && checkDate > validUntil) return false;

  return true;
};

RatePlanSchema.methods.calculateDerivedPrice = function (basePrice) {
  if (!this.is_derived) return basePrice;
  return basePrice * (1 + this.markup_percentage / 100);
};

RatePlanSchema.methods.getMealPlanName = function () {
  const mealPlans = {
    RO: 'Room Only',
    BB: 'Bed & Breakfast',
    HB: 'Half Board',
    FB: 'Full Board',
    AI: 'All Inclusive',
  };
  return mealPlans[this.meal_plan] || this.meal_plan;
};

// Statics
RatePlanSchema.statics.findByProperty = function (propertyId) {
  return this.find({ property_id: propertyId, is_active: true });
};

RatePlanSchema.statics.findPublic = function (propertyId) {
  return this.find({
    property_id: propertyId,
    is_active: true,
    is_public: true,
  });
};

module.exports = mongoose.model('RatePlan', RatePlanSchema);