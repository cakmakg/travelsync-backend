"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Contract Model (FIXED with Validations)
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const AgencyContractSchema = new mongoose.Schema(
  {
    // Note: organization_id is not stored here.
    // Hotel's organization: property.organization_id
    // Agency's organization: agency.organization_id

    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },

    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency ID is required'],
      index: true,
    },

    // Contract period
    valid_from: {
      type: Date,
      required: [true, 'Valid from date is required'],
    },
    valid_to: {
      type: Date,
      required: [true, 'Valid to date is required'],
    },

    // Commission
    commission_percentage: {
      type: Number,
      required: [true, 'Commission percentage is required'],
      min: [0, 'Commission cannot be negative'],
      max: [50, 'Commission cannot exceed 50%'],
    },

    // Allotment (guaranteed rooms)
    allotment: {
      has_allotment: { 
        type: Boolean, 
        default: false 
      },
      rooms_per_day: {
        type: Number,
        min: [0, 'Rooms per day cannot be negative'],
        validate: {
          validator: function(v) {
            // If has_allotment is true, rooms_per_day must be provided
            if (this.allotment.has_allotment && !v) {
              return false;
            }
            return true;
          },
          message: 'Rooms per day is required when allotment is enabled',
        },
      },
      release_days: {
        type: Number,
        min: [0, 'Release days cannot be negative'],
        max: [365, 'Release days cannot exceed 365'],
        default: 7, // Default 7 days before arrival
      },
    },

    // Special rates (optional - links to a specific rate plan)
    rate_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatePlan',
    },

    // Payment terms
    payment_terms: {
      method: {
        type: String,
        enum: ['INVOICE', 'CREDIT_CARD', 'BANK_TRANSFER', 'PREPAID'],
        default: 'INVOICE',
      },
      net_days: {
        type: Number,
        default: 30, // Net 30
        min: [0, 'Net days cannot be negative'],
        max: [365, 'Net days cannot exceed 365'],
      },
    },

    // Status
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED'],
      default: 'DRAFT',
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    // Cancellation policy
    cancellation_policy: {
      free_cancellation_days: {
        type: Number,
        default: 7,
        min: [0, 'Free cancellation days cannot be negative'],
      },
      penalty_percentage: {
        type: Number,
        default: 0,
        min: [0, 'Penalty cannot be negative'],
        max: [100, 'Penalty cannot exceed 100%'],
      },
    },

    // Notes
    notes: String,
  },
  {
    timestamps: true,
    collection: 'agency_contracts',
  }
);

// Indexes
AgencyContractSchema.index({ property_id: 1, agency_id: 1 }, { unique: true });
AgencyContractSchema.index({ valid_from: 1, valid_to: 1 });
AgencyContractSchema.index({ status: 1, is_active: 1 });

// Validation: valid_from must be before valid_to
AgencyContractSchema.pre('save', function(next) {
  if (this.valid_from >= this.valid_to) {
    return next(new Error('valid_from must be before valid_to'));
  }
  next();
});

// Validation: Update status based on dates
AgencyContractSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'ACTIVE') {
    if (now < this.valid_from) {
      this.status = 'DRAFT';
    } else if (now > this.valid_to) {
      this.status = 'EXPIRED';
    }
  }
  
  next();
});

// Method: Check if contract is valid for a date
AgencyContractSchema.methods.isValidForDate = function(date) {
  const checkDate = new Date(date);
  return (
    this.status === 'ACTIVE' &&
    this.is_active &&
    checkDate >= this.valid_from &&
    checkDate <= this.valid_to
  );
};

// Method: Check if allotment is available
AgencyContractSchema.methods.hasAvailableAllotment = function(date, requestedRooms) {
  if (!this.allotment.has_allotment) {
    return false;
  }

  const checkDate = new Date(date);
  const today = new Date();
  const daysUntilArrival = Math.floor((checkDate - today) / (1000 * 60 * 60 * 24));

  // Check if within release period
  if (daysUntilArrival < this.allotment.release_days) {
    return false; // Too close to arrival, allotment released
  }

  return requestedRooms <= this.allotment.rooms_per_day;
};

// Static: Find active contract for agency and property
AgencyContractSchema.statics.findActiveContract = async function(agencyId, propertyId, date = new Date()) {
  return this.findOne({
    agency_id: agencyId,
    property_id: propertyId,
    status: 'ACTIVE',
    is_active: true,
    valid_from: { $lte: date },
    valid_to: { $gte: date },
  });
};

module.exports = mongoose.model('AgencyContract', AgencyContractSchema);