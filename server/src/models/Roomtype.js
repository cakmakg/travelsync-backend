"use strict";
/* -------------------------------------------------------
    TravelSync - RoomType Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const RoomTypeSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      required: [true, 'Room type code is required'],
      maxlength: [10, 'Code cannot exceed 10 characters'],
    },

    name: {
      type: String,
      trim: true,
      required: [true, 'Room type name is required'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Capacity
capacity: {
  adults: {
    type: Number,
    required: [true, 'Adult capacity is required'],
    min: [1, 'Must accommodate at least 1 adult'],
    max: [10, 'Cannot exceed 10 adults'],
  },
  children: {
    type: Number,
    default: 0,
    min: [0, 'Cannot be negative'],
    max: [5, 'Cannot exceed 5 children'],
  },
  total: {
    type: Number,
    default: 0,
  },
},

    // Bed configuration
    bed_configuration: {
      type: String,
      trim: true,
      required: [true, 'Bed configuration is required'],
      examples: ['1 King Bed', '2 Single Beds', '1 Queen + 1 Sofa Bed'],
    },

    // Room size
    size_sqm: {
      type: Number,
      min: [10, 'Room size must be at least 10 sqm'],
      max: [500, 'Room size cannot exceed 500 sqm'],
    },

    // Total quantity of this room type
    total_quantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Must have at least 1 room'],
    },

    // Amenities
    amenities: [
      {
        type: String,
        enum: [
          'balcony',
          'terrace',
          'sea_view',
          'mountain_view',
          'city_view',
          'garden_view',
          'wifi',
          'tv',
          'minibar',
          'safe',
          'air_conditioning',
          'heating',
          'bathtub',
          'shower',
          'hairdryer',
          'coffee_machine',
          'desk',
          'sofa',
          'kitchenette',
          'disabled_access',
          'soundproof',
        ],
      },
    ],

    // Extra bed
    extra_bed_available: {
      type: Boolean,
      default: false,
    },

    extra_bed_price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
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
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Floor range (e.g., "1-3" for floors 1 to 3)
    floor_range: {
      type: String,
      trim: true,
    },

    // Smoking allowed
    smoking_allowed: {
      type: Boolean,
      default: false,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    is_bookable: {
      type: Boolean,
      default: true,
    },

    // Metadata
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    collection: 'room_types',
    timestamps: true,
  }
);

// Pre-save hook: Calculate total capacity
RoomTypeSchema.pre('save', function (next) {
  this.capacity.total = this.capacity.adults + this.capacity.children;
  next();
});

// Compound unique index: code must be unique within property
RoomTypeSchema.index({ property_id: 1, code: 1 }, { unique: true });
RoomTypeSchema.index({ is_active: 1 });
RoomTypeSchema.index({ is_bookable: 1 });

// Virtual: Prices
RoomTypeSchema.virtual('prices', {
  ref: 'Price',
  localField: '_id',
  foreignField: 'room_type_id',
});

// Virtual: Inventory
RoomTypeSchema.virtual('inventory', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'room_type_id',
});

// Methods
RoomTypeSchema.methods.isAvailable = function (_date) {
  // Parameter included for future per-date checks
  void _date;
  // Check if room type is bookable and active
  return this.is_active && this.is_bookable;
};

// Statics
RoomTypeSchema.statics.findByProperty = function (propertyId) {
  return this.find({ property_id: propertyId, is_active: true });
};

RoomTypeSchema.statics.findBookable = function (propertyId) {
  return this.find({
    property_id: propertyId,
    is_active: true,
    is_bookable: true,
  });
};

module.exports = mongoose.model('RoomType', RoomTypeSchema);