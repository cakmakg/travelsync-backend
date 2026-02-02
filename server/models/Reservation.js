"use strict";
/* -------------------------------------------------------
    TravelSync - Reservation Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');
const crypto = require('crypto');

const ReservationSchema = new mongoose.Schema(
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

    // Note: organization_id is not stored here.
    // Reservation always belongs to hotel's organization (property.organization_id)
    // For agency bookings, use agency_id field

    created_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
    },

    // Unique booking reference
    booking_reference: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      required: false,
      // Index defined below in schema.index()
    },

    // Idempotency key to prevent duplicate bookings
    idempotency_key: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      // Index defined below in schema.index()
    },

    // Guest information
    guest: {
      name: {
        type: String,
        trim: true,
        required: [true, 'Guest name is required'],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, 'Guest email is required'],
      },
      phone: {
        type: String,
        trim: true,
        required: [true, 'Guest phone is required'],
      },
      country: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: [2, 'Country code must be 2 characters'],
        maxlength: [2, 'Country code must be 2 characters'],
      },
      special_requests: {
        type: String,
        maxlength: [500, 'Special requests cannot exceed 500 characters'],
      },
    },

    // Booking dates
    check_in_date: {
      type: Date,
      required: [true, 'Check-in date is required'],
      index: true,
    },

    check_out_date: {
      type: Date,
      required: [true, 'Check-out date is required'],
      index: true,
    },

    nights: {
      type: Number,
      required: false,
      min: [1, 'Must be at least 1 night'],
    },

    // Number of guests
    guests: {
      adults: {
        type: Number,
        required: [true, 'Number of adults is required'],
        min: [1, 'Must have at least 1 adult'],
      },
      children: {
        type: Number,
        default: 0,
        min: [0, 'Cannot be negative'],
      },
      total: {
        type: Number,
        required: false,
      },
    },

    // Pricing
    total_price: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Total price is required'],
      min: [0, 'Price cannot be negative'],
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },

    total_with_tax: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Total price with tax is required'],
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'EUR',
      required: true,
    },

    // Breakdown (optional, for transparency)
    price_breakdown: [
      {
        date: Date,
        amount: mongoose.Schema.Types.Decimal128,
      },
    ],

    // Status
    status: {
      type: String,
      enum: [
        'option',      // Geçici kilitleme (24-48 saat)
        'pending',
        'confirmed',
        'checked_in',
        'checked_out',
        'cancelled',
        'no_show',
        'option_expired',  // Süresi dolmuş option
      ],
      default: 'pending',
      required: true,
      index: true,
    },

    // Option (geçici kilitleme) için süre
    option_expires_at: {
      type: Date,
      default: null,
      index: true,
    },

    option_hours: {
      type: Number,
      default: 24,  // Varsayılan 24 saat
      min: 1,
      max: 72,
    },

    // Booking source
    source: {
      type: String,
      enum: ['DIRECT', 'PHONE', 'EMAIL', 'OTA', 'AGENCY', 'GDS'],
      default: 'DIRECT',
      required: true,
      index: true,
    },
    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true,
    },
    agency_booking_ref: String,

    // External reference (from OTA or agency)
    external_ref: {
      type: String,
      trim: true,
      default: null,
    },

    // Commission (for agency bookings)
    commission: {
      percentage: {
        type: Number,
        default: 0,
        min: [0, 'Cannot be negative'],
        max: [100, 'Cannot exceed 100%'],
      },
      amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
        get: (value) => (value ? parseFloat(value.toString()) : 0),
      },
      currency: String,
      status: {
        type: String,
        enum: ['PENDING', 'INVOICED', 'PAID'],
        default: 'PENDING',
      },
      paid_date: Date,
    },
    payment_responsibility: {
      type: String,
      enum: ['GUEST', 'AGENCY', 'SPLIT'],
      default: 'GUEST',
    },

    // Payment information
    payment: {
      method: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
        default: null,
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'partially_paid', 'refunded'],
        default: 'pending',
      },
      paid_amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
        get: (value) => (value ? parseFloat(value.toString()) : 0),
      },
      transaction_id: {
        type: String,
        trim: true,
      },
    },

    // Important dates
    confirmed_at: {
      type: Date,
      default: null,
    },

    checked_in_at: {
      type: Date,
      default: null,
    },

    checked_out_at: {
      type: Date,
      default: null,
    },

    cancelled_at: {
      type: Date,
      default: null,
    },

    cancellation_reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },

    // Notes
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    collection: 'reservations',
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Pre-save hooks
ReservationSchema.pre('save', function (next) {
  // Calculate nights
  const checkIn = new Date(this.check_in_date);
  const checkOut = new Date(this.check_out_date);
  this.nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  // Calculate total guests
  this.guests.total = this.guests.adults + this.guests.children;

  // Generate booking reference if not exists
  if (!this.booking_reference) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.booking_reference = `BK-${date}-${random}`;
  }

  next();
});

// Indexes
// Note: booking_reference and idempotency_key already have indexes from unique: true
// No need to define them again with schema.index()
ReservationSchema.index({ property_id: 1, check_in_date: 1 });
ReservationSchema.index({ property_id: 1, status: 1 });
ReservationSchema.index({ 'guest.email': 1 });
ReservationSchema.index({ created_by_user_id: 1 });
ReservationSchema.index({ status: 1, check_in_date: 1 });

// Methods
ReservationSchema.methods.confirm = async function () {
  this.status = 'confirmed';
  this.confirmed_at = new Date();
  return this.save();
};

ReservationSchema.methods.checkIn = async function () {
  this.status = 'checked_in';
  this.checked_in_at = new Date();
  return this.save();
};

ReservationSchema.methods.checkOut = async function () {
  this.status = 'checked_out';
  this.checked_out_at = new Date();
  return this.save();
};

ReservationSchema.methods.cancel = async function (reason) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  if (reason) this.cancellation_reason = reason;
  return this.save();
};

ReservationSchema.methods.markAsNoShow = async function () {
  this.status = 'no_show';
  return this.save();
};

// Option (Geçici Kilitleme) Metotları
ReservationSchema.methods.confirmOption = async function () {
  if (this.status !== 'option') {
    throw new Error('Only option reservations can be confirmed');
  }
  if (this.isOptionExpired()) {
    throw new Error('Option has expired');
  }
  this.status = 'confirmed';
  this.confirmed_at = new Date();
  this.option_expires_at = null;
  return this.save();
};

ReservationSchema.methods.expireOption = async function () {
  if (this.status !== 'option') {
    throw new Error('Only option reservations can expire');
  }
  this.status = 'option_expired';
  return this.save();
};

ReservationSchema.methods.isOptionExpired = function () {
  if (this.status !== 'option') return false;
  if (!this.option_expires_at) return false;
  return new Date() > this.option_expires_at;
};

ReservationSchema.methods.getTotalPrice = function () {
  return parseFloat(this.total_price.toString());
};

ReservationSchema.methods.getTotalWithTax = function () {
  return parseFloat(this.total_with_tax.toString());
};

ReservationSchema.methods.calculateCommission = async function () {
  if (!this.agency_id) return 0;

  const Agency = require('./Agency');
  const agency = await Agency.findById(this.agency_id);
  if (!agency) return 0;

  const rate = agency.getCommissionRate(this.property_id);
  const amount = (this.total_price * rate) / 100;

  this.commission = {
    percentage: rate,
    amount,
    currency: this.currency,
    status: 'PENDING',
  };

  await this.save();
  return amount;
};

// Statics
ReservationSchema.statics.findByProperty = function (
  propertyId,
  filters = {}
) {
  return this.find({
    property_id: propertyId,
    ...filters,
  }).sort({ check_in_date: -1 });
};

ReservationSchema.statics.findUpcoming = function (propertyId, days = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return this.find({
    property_id: propertyId,
    check_in_date: {
      $gte: today,
      $lte: futureDate,
    },
    status: { $in: ['confirmed', 'pending'] },
  }).sort({ check_in_date: 1 });
};

ReservationSchema.statics.findTodayCheckIns = function (propertyId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    property_id: propertyId,
    check_in_date: {
      $gte: today,
      $lt: tomorrow,
    },
    status: { $in: ['confirmed', 'pending'] },
  });
};

ReservationSchema.statics.findTodayCheckOuts = function (propertyId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    property_id: propertyId,
    check_out_date: {
      $gte: today,
      $lt: tomorrow,
    },
    status: 'checked_in',
  });
};

ReservationSchema.statics.findInHouse = function (propertyId) {
  return this.find({
    property_id: propertyId,
    status: 'checked_in',
  });
};

module.exports = mongoose.model('Reservation', ReservationSchema);