"use strict";
/* -------------------------------------------------------
    TravelSync - Payment Model (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
    Payment transactions for travelers
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const PaymentSchema = new mongoose.Schema(
  {
    // Payment Identity
    payment_id: {
      type: String,
      unique: true, // Automatically creates index
      required: true,
    },
    transaction_id: String, // External payment gateway transaction ID

    // Related Entities
    traveler_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Traveler',
      // Index defined below in schema.index()
    },
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      // Index defined below in schema.index()
    },
    trip_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      index: true,
    },

    // Payment Details
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Amount is required'],
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },
    currency: {
      type: String,
      required: true,
      default: 'EUR',
      uppercase: true,
    },
    tax_amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },
    total_amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },

    // Payment Method
    payment_method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'other'],
      required: true,
    },
    payment_provider: {
      type: String,
      enum: ['stripe', 'paypal', 'adyen', 'square', 'other'],
    },

    // Card Details (encrypted/hashed)
    card_last4: String,
    card_brand: String, // 'visa', 'mastercard', 'amex'
    card_expiry_month: Number,
    card_expiry_year: Number,

    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },

    // Refund
    refund_amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
      get: (value) => (value ? parseFloat(value.toString()) : 0),
    },
    refund_reason: String,
    refunded_at: Date,

    // Timestamps
    paid_at: Date,
    failed_at: Date,
    cancelled_at: Date,

    // Metadata
    description: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    // Error handling
    error_message: String,
    error_code: String,
  },
  {
    timestamps: true,
    collection: 'payments',
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Indexes
// Note: payment_id already has index from unique: true
// No need to define it again with schema.index()
PaymentSchema.index({ traveler_id: 1, status: 1 });
PaymentSchema.index({ reservation_id: 1 });
PaymentSchema.index({ transaction_id: 1 }, { sparse: true });
PaymentSchema.index({ created_at: -1 });

// Pre-save: Generate payment ID
PaymentSchema.pre('save', function (next) {
  if (!this.payment_id) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = require('crypto').randomBytes(4).toString('hex').toUpperCase();
    this.payment_id = `PAY-${date}-${random}`;
  }
  next();
});

// Method: Mark as completed
PaymentSchema.methods.markAsCompleted = async function (transactionId = null) {
  this.status = 'completed';
  this.paid_at = new Date();
  if (transactionId) this.transaction_id = transactionId;
  return this.save();
};

// Method: Mark as failed
PaymentSchema.methods.markAsFailed = async function (errorMessage, errorCode = null) {
  this.status = 'failed';
  this.failed_at = new Date();
  this.error_message = errorMessage;
  if (errorCode) this.error_code = errorCode;
  return this.save();
};

// Method: Refund
PaymentSchema.methods.refund = async function (amount, reason) {
  this.status = 'refunded';
  this.refund_amount = amount || this.total_amount;
  this.refund_reason = reason;
  this.refunded_at = new Date();
  return this.save();
};

// Static: Find by traveler
PaymentSchema.statics.findByTraveler = function (travelerId, filters = {}) {
  const query = { traveler_id: travelerId };
  if (filters.status) query.status = filters.status;
  if (filters.start_date || filters.end_date) {
    query.created_at = {};
    if (filters.start_date) query.created_at.$gte = new Date(filters.start_date);
    if (filters.end_date) query.created_at.$lte = new Date(filters.end_date);
  }
  return this.find(query).sort({ created_at: -1 });
};

module.exports = mongoose.model('Payment', PaymentSchema);

