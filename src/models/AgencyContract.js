"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Contract Model
    Agreements between hotels and agencies
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const AgencyContractSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },

    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },

    // Contract period
    valid_from: {
      type: Date,
      required: true,
    },
    valid_to: {
      type: Date,
      required: true,
    },

    // Commission
    commission_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 50,
    },

    // Allotment (guaranteed rooms)
    allotment: {
      has_allotment: { type: Boolean, default: false },
      rooms_per_day: Number,
      release_days: Number, // Days before arrival to release unsold rooms
    },

    // Special rates
    rate_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatePlan',
    },

    // Payment terms
    payment_terms: {
      method: String,
      net_days: Number,
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
  },
  {
    timestamps: true,
    collection: 'agency_contracts',
  }
);

// Indexes
AgencyContractSchema.index({ property_id: 1, agency_id: 1 });
AgencyContractSchema.index({ valid_from: 1, valid_to: 1 });

module.exports = mongoose.model('AgencyContract', AgencyContractSchema);