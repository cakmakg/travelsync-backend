"use strict";
/* -------------------------------------------------------
    TravelSync - Trip Model (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
    Travel plans/itineraries for travelers
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const TripSchema = new mongoose.Schema(
  {
    traveler_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Traveler',
      required: [true, 'Traveler ID is required'],
      // Index defined below in schema.index()
    },

    // Trip Details
    trip_name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
    },
    description: String,

    // Dates
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
    },
    duration_days: Number,
    duration_nights: Number,

    // Destination
    destination: {
      country: String,
      city: String,
      region: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Travelers
    travelers: [
      {
        name: String,
        age: Number,
        relationship: String, // 'self', 'spouse', 'child', 'friend'
      },
    ],
    adults: {
      type: Number,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },

    // Budget
    budget: {
      total: Number,
      currency: String,
      spent: {
        type: Number,
        default: 0,
      },
    },

    // Status
    status: {
      type: String,
      enum: ['planning', 'booked', 'in_progress', 'completed', 'cancelled'],
      default: 'planning',
    },

    // Bookings (linked reservations)
    bookings: [
      {
        reservation_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Reservation',
        },
        property_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Property',
        },
        check_in: Date,
        check_out: Date,
        status: String,
      },
    ],

    // Activities (planned activities)
    activities: [
      {
        name: String,
        date: Date,
        time: String,
        location: String,
        cost: Number,
        notes: String,
      },
    ],

    // Notes
    notes: String,
    tags: [String],

    // Sharing
    is_shared: {
      type: Boolean,
      default: false,
    },
    shared_with: [
      {
        traveler_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Traveler',
        },
        permission: {
          type: String,
          enum: ['view', 'edit'],
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'trips',
  }
);

// Indexes
TripSchema.index({ traveler_id: 1, status: 1 });
TripSchema.index({ start_date: 1, end_date: 1 });
TripSchema.index({ 'destination.country': 1, 'destination.city': 1 });
TripSchema.index({ status: 1 });

// Pre-save: Calculate duration
TripSchema.pre('save', function (next) {
  if (this.start_date && this.end_date) {
    const start = new Date(this.start_date);
    const end = new Date(this.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.duration_days = diffDays;
    this.duration_nights = Math.max(0, diffDays - 1);
  }
  next();
});

// Method: Get trip progress
TripSchema.methods.getProgress = function () {
  const today = new Date();
  if (today < this.start_date) return 'upcoming';
  if (today >= this.start_date && today <= this.end_date) return 'in_progress';
  if (today > this.end_date) return 'completed';
  return 'unknown';
};

// Static: Find upcoming trips
TripSchema.statics.findUpcoming = function (travelerId, limit = 10) {
  const today = new Date();
  return this.find({
    traveler_id: travelerId,
    start_date: { $gte: today },
    status: { $in: ['planning', 'booked'] },
  })
    .sort({ start_date: 1 })
    .limit(limit);
};

module.exports = mongoose.model('Trip', TripSchema);

