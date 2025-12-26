"use strict";
/* -------------------------------------------------------
    TravelSync - Wishlist Model (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
    Wishlist/saved properties for travelers
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const WishlistSchema = new mongoose.Schema(
  {
    traveler_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Traveler',
      required: [true, 'Traveler ID is required'],
      // Index defined below in schema.index()
    },

    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      // Index defined below in schema.index()
    },

    // Wishlist details
    notes: String,
    tags: [String],

    // Travel dates (if planning to visit)
    planned_check_in: Date,
    planned_check_out: Date,
    planned_guests: {
      adults: Number,
      children: Number,
    },

    // Priority
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
      comment: '0 = low, 10 = high priority',
    },

    // Notification settings
    price_alerts: {
      type: Boolean,
      default: false,
    },
    availability_alerts: {
      type: Boolean,
      default: false,
    },
    target_price: Number,

    // Status
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'wishlists',
  }
);

// Indexes
WishlistSchema.index({ traveler_id: 1, property_id: 1 }, { unique: true });
WishlistSchema.index({ traveler_id: 1, is_active: 1 });
WishlistSchema.index({ property_id: 1 });
WishlistSchema.index({ priority: -1 });

// Static: Find by traveler
WishlistSchema.statics.findByTraveler = function (travelerId, filters = {}) {
  const query = {
    traveler_id: travelerId,
    is_active: true,
  };

  if (filters.priority) {
    query.priority = { $gte: filters.priority };
  }

  return this.find(query)
    .populate('property_id', 'name city country star_rating amenities images')
    .sort({ priority: -1, created_at: -1 });
};

// Static: Check if property is in wishlist
WishlistSchema.statics.isInWishlist = async function (travelerId, propertyId) {
  const wishlist = await this.findOne({
    traveler_id: travelerId,
    property_id: propertyId,
    is_active: true,
  });
  return !!wishlist;
};

module.exports = mongoose.model('Wishlist', WishlistSchema);

