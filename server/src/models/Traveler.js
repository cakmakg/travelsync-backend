"use strict";
/* -------------------------------------------------------
    TravelSync - Traveler Model (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const TravelerSchema = new mongoose.Schema(
  {
    // Authentication
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // Index defined below in schema.index()
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
    },

    // Profile
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar_url: String,
    date_of_birth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },

    // Address
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postal_code: String,
    },

    // Travel Preferences
    preferences: {
      // Travel style
      travel_style: {
        type: [String],
        enum: ['budget', 'mid_range', 'luxury', 'backpacker', 'business', 'family', 'romantic', 'adventure'],
      },
      
      // Accommodation preferences
      preferred_room_types: [String],
      preferred_amenities: [String],
      budget_range: {
        min: Number,
        max: Number,
        currency: String,
      },
      
      // Travel preferences
      preferred_destinations: [String],
      travel_interests: {
        type: [String],
        enum: ['culture', 'beach', 'adventure', 'nightlife', 'nature', 'food', 'shopping', 'history'],
      },
      
      // Special needs
      special_needs: [String],
      dietary_restrictions: [String],
      accessibility_needs: [String],
    },

    // Travel Documents
    documents: {
      passport_number: String,
      passport_expiry: Date,
      nationality: String,
      visa_requirements: [String],
    },

    // Loyalty & Rewards
    loyalty_points: {
      type: Number,
      default: 0,
    },
    loyalty_tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },

    // Statistics
    stats: {
      total_trips: {
        type: Number,
        default: 0,
      },
      total_bookings: {
        type: Number,
        default: 0,
      },
      total_spent: {
        type: Number,
        default: 0,
      },
      favorite_destinations: [String],
    },

    // Settings
    settings: {
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'de', 'fr', 'es', 'tr'],
      },
      currency: {
        type: String,
        default: 'EUR',
      },
      timezone: String,
      email_notifications: {
        type: Boolean,
        default: true,
      },
      sms_notifications: {
        type: Boolean,
        default: false,
      },
      marketing_consent: {
        type: Boolean,
        default: false,
      },
    },

    // Status
    is_active: {
      type: Boolean,
      default: true,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    email_verification_token: String,
    email_verification_expires: Date,

    // Password reset
    password_reset_token: String,
    password_reset_expires: Date,

    // Last login
    last_login_at: Date,
  },
  {
    timestamps: true,
    collection: 'travelers',
  }
);

// Indexes
// Note: email already has index from unique: true
// No need to define it again with schema.index()
TravelerSchema.index({ 'preferences.travel_style': 1 });
TravelerSchema.index({ loyalty_tier: 1 });
TravelerSchema.index({ is_active: 1 });

// Virtual: Full name
TravelerSchema.virtual('full_name').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Method: Get traveler stats
TravelerSchema.methods.getStats = function () {
  return {
    total_trips: this.stats.total_trips,
    total_bookings: this.stats.total_bookings,
    total_spent: this.stats.total_spent,
    loyalty_points: this.loyalty_points,
    loyalty_tier: this.loyalty_tier,
  };
};

// Static: Find by email
TravelerSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('Traveler', TravelerSchema);

