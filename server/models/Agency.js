"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Model
    Travel agencies that book rooms
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const AgencySchema = new mongoose.Schema(
  {
    // Organization link (multi-tenant)
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Basic info
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['OTA', 'TOUR_OPERATOR', 'TRAVEL_AGENCY', 'CORPORATE', 'GDS'],
      default: 'TRAVEL_AGENCY',
    },

    // Contact
    contact: {
      email: { type: String, required: true },
      phone: String,
      website: String,
    },

    // Address
    address: {
      street: String,
      city: String,
      country: { type: String, required: true },
      postal_code: String,
    },

    // Commission settings
    commission: {
      default_percentage: {
        type: Number,
        default: 10,
        min: 0,
        max: 50,
      },
      // Per property override
      property_rates: [
        {
          property_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
          },
          percentage: Number,
        },
      ],
    },

    // API credentials (for channel manager)
    api_credentials: {
      api_key: String,
      api_secret: String,
      endpoint: String,
      is_active: { type: Boolean, default: false },
    },

    // Payment terms
    payment: {
      method: {
        type: String,
        enum: ['INVOICE', 'CREDIT_CARD', 'BANK_TRANSFER', 'PREPAID'],
        default: 'INVOICE',
      },
      payment_terms_days: { type: Number, default: 30 }, // Net 30
      currency: { type: String, default: 'EUR' },
    },

    // Status
    is_active: {
      type: Boolean,
      default: true,
    },

    // Stats (cache)
    stats: {
      total_bookings: { type: Number, default: 0 },
      total_revenue: { type: Number, default: 0 },
      total_commission: { type: Number, default: 0 },
    },

    // WhatsApp Bildirim Ayarları (Flash Offer için)
    whatsapp_settings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      phone_number: {
        type: String,
        trim: true,
        // E.164 formatı: +491234567890
        match: [/^\+[1-9]\d{1,14}$/, 'Geçerli bir telefon numarası girin (+491234567890)'],
      },
      verified: {
        type: Boolean,
        default: false,
      },
      notification_types: {
        flash_offers: { type: Boolean, default: true },
        new_reservations: { type: Boolean, default: false },
        cancellations: { type: Boolean, default: false },
      },
      preferred_language: {
        type: String,
        enum: ['de', 'en', 'tr'],
        default: 'de',
      },
    },
  },
  {
    timestamps: true,
    collection: 'agencies',
  }
);

// Indexes
AgencySchema.index({ organization_id: 1, code: 1 });
AgencySchema.index({ organization_id: 1, is_active: 1 });

// Get commission rate for property
AgencySchema.methods.getCommissionRate = function (propertyId) {
  const override = this.commission.property_rates.find(
    r => r.property_id.toString() === propertyId.toString()
  );
  return override ? override.percentage : this.commission.default_percentage;
};

module.exports = mongoose.model('Agency', AgencySchema);