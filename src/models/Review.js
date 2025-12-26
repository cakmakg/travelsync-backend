"use strict";
/* -------------------------------------------------------
    TravelSync - Review Model (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
    Reviews/ratings from travelers
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const ReviewSchema = new mongoose.Schema(
  {
    // Related Entities
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
      // Indexed in compound index below (no separate index needed)
    },
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      // Index defined below in schema.index()
    },

    // Ratings (1-5 stars)
    ratings: {
      overall: {
        type: Number,
        required: [true, 'Overall rating is required'],
        min: 1,
        max: 5,
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      location: {
        type: Number,
        min: 1,
        max: 5,
      },
      service: {
        type: Number,
        min: 1,
        max: 5,
      },
      value: {
        type: Number,
        min: 1,
        max: 5,
      },
      amenities: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    // Review Content
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },

    // Traveler Info (at time of review)
    traveler_info: {
      name: String,
      country: String,
      trip_type: {
        type: String,
        enum: ['business', 'leisure', 'family', 'couples', 'solo'],
      },
      stay_date: Date,
      room_type: String,
    },

    // Helpful votes
    helpful_count: {
      type: Number,
      default: 0,
    },
    helpful_votes: [
      {
        traveler_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Traveler',
        },
        voted_at: Date,
      },
    ],

    // Response from hotel
    hotel_response: {
      response: String,
      responded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      responded_at: Date,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
      comment: 'Verified booking (traveler actually stayed)',
    },
    is_featured: {
      type: Boolean,
      default: false,
    },

    // Moderation
    moderation_notes: String,
    moderated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderated_at: Date,
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

// Indexes
// Compound indexes for query optimization
// Note: Using single compound index with ratings for property queries (covers property_id + status queries)
ReviewSchema.index({ traveler_id: 1 });
ReviewSchema.index({ reservation_id: 1 }, { sparse: true });
ReviewSchema.index({ 'ratings.overall': -1 });
ReviewSchema.index({ created_at: -1 });
ReviewSchema.index({ is_featured: 1, status: 1 });

// Compound index for property reviews with ratings (covers property_id + status queries via left-prefix rule)
ReviewSchema.index({ property_id: 1, status: 1, 'ratings.overall': -1 });

// Virtual: Average rating
ReviewSchema.virtual('average_rating').get(function () {
  const ratings = this.ratings;
  const values = [
    ratings.overall,
    ratings.cleanliness,
    ratings.location,
    ratings.service,
    ratings.value,
    ratings.amenities,
  ].filter((r) => r !== undefined && r !== null);

  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

// Method: Mark as helpful
ReviewSchema.methods.markAsHelpful = async function (travelerId) {
  const existingVote = this.helpful_votes.find(
    (v) => v.traveler_id.toString() === travelerId.toString()
  );

  if (!existingVote) {
    this.helpful_votes.push({
      traveler_id: travelerId,
      voted_at: new Date(),
    });
    this.helpful_count += 1;
    return this.save();
  }

  return this;
};

// Static: Find by property
ReviewSchema.statics.findByProperty = function (propertyId, filters = {}) {
  const query = {
    property_id: propertyId,
    status: 'approved',
  };

  if (filters.min_rating) {
    query['ratings.overall'] = { $gte: filters.min_rating };
  }

  return this.find(query)
    .populate('traveler_id', 'first_name last_name country')
    .sort({ created_at: -1 });
};

// Static: Get average rating for property
ReviewSchema.statics.getAverageRating = async function (propertyId) {
  const mongoose = require('mongoose');
  const result = await this.aggregate([
    {
      $match: {
        property_id: new mongoose.Types.ObjectId(propertyId),
        status: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        overall: { $avg: '$ratings.overall' },
        cleanliness: { $avg: '$ratings.cleanliness' },
        location: { $avg: '$ratings.location' },
        service: { $avg: '$ratings.service' },
        value: { $avg: '$ratings.value' },
        amenities: { $avg: '$ratings.amenities' },
        total_reviews: { $sum: 1 },
      },
    },
  ]);

  return result[0] || {
    overall: 0,
    cleanliness: 0,
    location: 0,
    service: 0,
    value: 0,
    amenities: 0,
    total_reviews: 0,
  };
};

module.exports = mongoose.model('Review', ReviewSchema);

