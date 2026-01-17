"use strict";
/* -------------------------------------------------------
    TravelSync - Property Model (Hotel)
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const PropertySchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: [true, 'Property name is required'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      required: [true, 'Property code is required'],
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },

    // Address information
    address: {
      street: {
        type: String,
        trim: true,
        required: [true, 'Street address is required'],
      },
      city: {
        type: String,
        trim: true,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        trim: true,
      },
      postal_code: {
        type: String,
        trim: true,
        required: [true, 'Postal code is required'],
      },
      country: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Country is required'],
        minlength: [2, 'Country code must be 2 characters'],
        maxlength: [2, 'Country code must be 2 characters'],
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Property details
    star_rating: {
      type: Number,
      min: [1, 'Star rating must be between 1 and 5'],
      max: [5, 'Star rating must be between 1 and 5'],
    },

    property_type: {
      type: String,
      enum: ['hotel', 'resort', 'apartment', 'hostel', 'villa', 'guesthouse'],
      default: 'hotel',
    },

    total_rooms: {
      type: Number,
      required: [true, 'Total rooms count is required'],
      min: [1, 'Must have at least 1 room'],
    },

    total_floors: {
      type: Number,
      min: [1, 'Must have at least 1 floor'],
    },

    // Amenities (facilities)
    amenities: [
      {
        type: String,
        enum: [
          'wifi',
          'parking',
          'pool',
          'gym',
          'spa',
          'restaurant',
          'bar',
          'room_service',
          'laundry',
          'concierge',
          'airport_shuttle',
          'business_center',
          'meeting_rooms',
          'pet_friendly',
          'disabled_access',
          'air_conditioning',
          'heating',
        ],
      },
    ],

    // Check-in/out times
    check_in_time: {
      type: String,
      default: '15:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },

    check_out_time: {
      type: String,
      default: '11:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },

    // Contact information
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
        required: [true, 'Phone number is required'],
      },
      website: {
        type: String,
        trim: true,
      },
    },

    // Property settings
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'EUR',
      minlength: [3, 'Currency code must be 3 characters'],
      maxlength: [3, 'Currency code must be 3 characters'],
    },

    timezone: {
      type: String,
      trim: true,
      default: 'Europe/Berlin',
    },

    // Tax settings
    tax_rate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },

    tax_included: {
      type: Boolean,
      default: false,
    },

    // Vergi Numarası (GoBD uyumluluk için)
    tax_id: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot exceed 50 characters'],
    },

    // PMS Entegrasyon Ayarları (Protel, SIHOT, vb.)
    pms_settings: {
      provider: {
        type: String,
        enum: ['protel', 'sihot', 'opera', 'mews', 'manual', null],
        default: null,
      },
      api_key: {
        type: String,
        select: false, // Güvenlik: varsayılan sorgularda döndürme
      },
      api_secret: {
        type: String,
        select: false,
      },
      endpoint: {
        type: String,
        trim: true,
      },
      is_connected: {
        type: Boolean,
        default: false,
      },
      last_sync: {
        type: Date,
      },
      sync_frequency: {
        type: String,
        enum: ['realtime', 'hourly', 'daily', 'manual'],
        default: 'manual',
      },
    },

    // Images
    images: [
      {
        url: String,
        alt: String,
        is_primary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Description
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    // Metadata
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    collection: 'properties',
    timestamps: true,
  }
);

// Compound unique index: code must be unique within organization
PropertySchema.index({ organization_id: 1, code: 1 }, { unique: true });
PropertySchema.index({ is_active: 1 });
PropertySchema.index({ star_rating: 1 });
PropertySchema.index({ 'address.city': 1 });
PropertySchema.index({ 'address.country': 1 });

// Virtual: Room types
PropertySchema.virtual('room_types', {
  ref: 'RoomType',
  localField: '_id',
  foreignField: 'property_id',
});

// Virtual: Rate plans
PropertySchema.virtual('rate_plans', {
  ref: 'RatePlan',
  localField: '_id',
  foreignField: 'property_id',
});

// Methods
PropertySchema.methods.getFullAddress = function () {
  return `${this.address.street}, ${this.address.postal_code} ${this.address.city}, ${this.address.country}`;
};

// Statics
PropertySchema.statics.findByOrganization = function (organizationId) {
  return this.find({ organization_id: organizationId, is_active: true });
};

module.exports = mongoose.model('Property', PropertySchema);