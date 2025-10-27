"use strict";
/* -------------------------------------------------------
    TravelSync - Inventory Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const InventorySchema = new mongoose.Schema(
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

    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },

    // Total rooms available for this room type on this date
    allotment: {
      type: Number,
      required: [true, 'Allotment is required'],
      min: [0, 'Allotment cannot be negative'],
    },

    // Number of rooms already sold/reserved
    sold: {
      type: Number,
      default: 0,
      min: [0, 'Sold cannot be negative'],
    },

    // Available = Allotment - Sold (calculated)
    available: {
      type: Number,
      required: true,
      min: [0, 'Available cannot be negative'],
    },

    // Stop-sell: Prevent new bookings even if available > 0
    stop_sell: {
      type: Boolean,
      default: false,
    },

    // Closed: Room type not available at all on this date
    closed: {
      type: Boolean,
      default: false,
    },

    // Overbooking allowance
    overbooking_allowed: {
      type: Number,
      default: 0,
      min: [0, 'Cannot be negative'],
      comment: 'Number of extra bookings allowed beyond allotment',
    },

    // Minimum stay requirement override for this date
    min_nights_override: {
      type: Number,
      default: null,
      min: [1, 'Must be at least 1 night'],
    },

    // Metadata
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    collection: 'inventory',
    timestamps: true,
  }
);

// Pre-save hook: Calculate available
InventorySchema.pre('save', function (next) {
  this.available = this.allotment - this.sold + this.overbooking_allowed;
  
  // Ensure available doesn't go negative
  if (this.available < 0) {
    this.available = 0;
  }
  
  next();
});

// Compound unique index: One inventory record per room type + date
InventorySchema.index(
  { property_id: 1, room_type_id: 1, date: 1 },
  { unique: true }
);
InventorySchema.index({ date: 1 });
InventorySchema.index({ available: 1 });

// Methods
InventorySchema.methods.isBookable = function (rooms = 1) {
  // Check if we can book the requested number of rooms
  if (this.closed || this.stop_sell) return false;
  return this.available >= rooms;
};

InventorySchema.methods.incrementSold = async function (quantity = 1) {
  this.sold += quantity;
  this.available = this.allotment - this.sold + this.overbooking_allowed;
  return this.save();
};

InventorySchema.methods.decrementSold = async function (quantity = 1) {
  this.sold = Math.max(0, this.sold - quantity);
  this.available = this.allotment - this.sold + this.overbooking_allowed;
  return this.save();
};

InventorySchema.methods.getOccupancyRate = function () {
  if (this.allotment === 0) return 0;
  return (this.sold / this.allotment) * 100;
};

// Statics
InventorySchema.statics.findForDateRange = function (
  propertyId,
  roomTypeId,
  startDate,
  endDate
) {
  return this.find({
    property_id: propertyId,
    room_type_id: roomTypeId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });
};

InventorySchema.statics.checkAvailability = async function (
  propertyId,
  roomTypeId,
  checkInDate,
  checkOutDate,
  roomsNeeded = 1
) {
  const inventory = await this.findForDateRange(
    propertyId,
    roomTypeId,
    checkInDate,
    checkOutDate
  );

  // Check each night (excluding check-out date)
  const checkOut = new Date(checkOutDate);
  for (const inv of inventory) {
    const invDate = new Date(inv.date);
    
    // Skip check-out date (standard hotel practice)
    if (invDate.toDateString() === checkOut.toDateString()) continue;

    // Check if this night is bookable
    if (!inv.isBookable(roomsNeeded)) {
      return {
        available: false,
        date: inv.date,
        reason: inv.closed
          ? 'closed'
          : inv.stop_sell
          ? 'stop_sell'
          : 'no_availability',
      };
    }
  }

  return { available: true };
};

InventorySchema.statics.bulkUpdateInventory = async function (
  propertyId,
  roomTypeId,
  startDate,
  endDate,
  allotment,
  stopSell = false
) {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        property_id: propertyId,
        room_type_id: roomTypeId,
        date: date,
      },
      update: {
        $set: {
          allotment: allotment,
          stop_sell: stopSell,
          updated_at: new Date(),
        },
      },
      upsert: true,
    },
  }));

  return this.bulkWrite(bulkOps);
};

InventorySchema.statics.updateOnBooking = async function (
  propertyId,
  roomTypeId,
  checkInDate,
  checkOutDate,
  roomsBooked = 1
) {
  const dates = [];
  const currentDate = new Date(checkInDate);
  const end = new Date(checkOutDate);

  // Don't include checkout date
  while (currentDate < end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        property_id: propertyId,
        room_type_id: roomTypeId,
        date: date,
      },
      update: {
        $inc: { sold: roomsBooked },
        $set: { updated_at: new Date() },
      },
    },
  }));

  return this.bulkWrite(bulkOps);
};

InventorySchema.statics.updateOnCancellation = async function (
  propertyId,
  roomTypeId,
  checkInDate,
  checkOutDate,
  roomsBooked = 1
) {
  const dates = [];
  const currentDate = new Date(checkInDate);
  const end = new Date(checkOutDate);

  // Don't include checkout date
  while (currentDate < end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        property_id: propertyId,
        room_type_id: roomTypeId,
        date: date,
      },
      update: {
        $inc: { sold: -roomsBooked },
        $set: { updated_at: new Date() },
      },
    },
  }));

  return this.bulkWrite(bulkOps);
};

module.exports = mongoose.model('Inventory', InventorySchema);