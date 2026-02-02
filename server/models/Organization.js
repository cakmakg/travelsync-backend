"use strict";
/* -------------------------------------------------------
    TravelSync - Organization Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const OrganizationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['HOTEL', 'AGENCY'],
      required: [true, 'Organization type is required'],
      default: 'HOTEL',
    },

    name: {
      type: String,
      trim: true,
      required: [true, 'Organization name is required'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    country: {
      type: String,
      trim: true,
      required: [true, 'Country is required'],
      uppercase: true,
      minlength: [2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)'],
      maxlength: [2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)'],
    },

    timezone: {
      type: String,
      trim: true,
      required: [true, 'Timezone is required'],
      default: 'Europe/Berlin',
    },

    currency: {
      type: String,
      trim: true,
      required: [true, 'Currency is required'],
      uppercase: true,
      minlength: [3, 'Currency code must be 3 characters (ISO 4217)'],
      maxlength: [3, 'Currency code must be 3 characters (ISO 4217)'],
      default: 'EUR',
    },

    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'en',
    },

    // Subscription management
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'past_due'],
        default: 'active',
      },
      current_period_start: {
        type: Date,
        default: Date.now,
      },
      current_period_end: {
        type: Date,
        default: function () {
          // Default: 30 days from now
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date;
        },
      },
      max_properties: {
        type: Number,
        default: 1, // Free tier: 1 property
      },
      max_users: {
        type: Number,
        default: 2, // Free tier: 2 users
      },
    },

    // Settings
    settings: {
      date_format: {
        type: String,
        default: 'DD/MM/YYYY',
      },
      time_format: {
        type: String,
        default: '24h',
        enum: ['12h', '24h'],
      },
      week_start: {
        type: String,
        default: 'monday',
        enum: ['sunday', 'monday'],
      },
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
      },
      website: {
        type: String,
        trim: true,
      },
    },

    // Billing information
    billing: {
      company_name: String,
      tax_id: String,
      address: {
        street: String,
        city: String,
        state: String,
        postal_code: String,
        country: String,
      },
    },

    // Onboarding status
    onboarding_completed: {
      type: Boolean,
      default: false,
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
    // Soft delete
    deleted_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    collection: 'organizations',
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Indexes
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ type: 1 });
OrganizationSchema.index({ is_active: 1 });
OrganizationSchema.index({ 'subscription.status': 1 });

// Virtual: Get active properties count (will be used later)
OrganizationSchema.virtual('properties', {
  ref: 'Property',
  localField: '_id',
  foreignField: 'organization_id',
});

// Virtual: Get users count
OrganizationSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization_id',
});

// Methods
OrganizationSchema.methods.canAddProperty = function () {
  // Check if organization can add more properties based on subscription
  const currentCount = this.properties?.length || 0;
  return currentCount < this.subscription.max_properties;
};

OrganizationSchema.methods.canAddUser = function () {
  // Check if organization can add more users based on subscription
  const currentCount = this.users?.length || 0;
  return currentCount < this.subscription.max_users;
};

module.exports = mongoose.model('Organization', OrganizationSchema);