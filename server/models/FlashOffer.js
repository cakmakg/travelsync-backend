"use strict";
/* -------------------------------------------------------
    TravelSync - Flash Offer Model
    Time-limited discount offers from hotels to agencies
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const FlashOfferSchema = new mongoose.Schema(
    {
        // Hotel organization creating the offer
        hotel_org_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Hotel organization ID is required'],
            index: true,
        },

        property_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: [true, 'Property ID is required'],
            index: true,
        },

        room_type_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomType',
            index: true,
        },

        // Offer details
        title: {
            type: String,
            required: [true, 'Offer title is required'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },

        description: {
            type: String,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },

        // Discount configuration
        discount_type: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
        },

        discount_value: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [0, 'Discount cannot be negative'],
        },

        // Original and discounted price
        original_price: {
            type: mongoose.Schema.Types.Decimal128,
            get: (value) => (value ? parseFloat(value.toString()) : 0),
        },

        discounted_price: {
            type: mongoose.Schema.Types.Decimal128,
            get: (value) => (value ? parseFloat(value.toString()) : 0),
        },

        // Availability
        rooms_available: {
            type: Number,
            required: [true, 'Rooms available is required'],
            min: [1, 'At least 1 room must be available'],
        },

        rooms_booked: {
            type: Number,
            default: 0,
            min: [0, 'Rooms booked cannot be negative'],
        },

        // Validity period
        valid_from: {
            type: Date,
            required: [true, 'Valid from date is required'],
        },

        valid_to: {
            type: Date,
            required: [true, 'Valid to date is required'],
        },

        // Offer expiration (when the offer itself expires)
        offer_expires_at: {
            type: Date,
            required: [true, 'Offer expiration is required'],
            index: true,
        },

        // Stay dates that this offer applies to
        stay_date_from: {
            type: Date,
            required: [true, 'Stay date from is required'],
        },

        stay_date_to: {
            type: Date,
            required: [true, 'Stay date to is required'],
        },

        // Targeting
        target_type: {
            type: String,
            enum: ['all_partners', 'specific_agencies'],
            default: 'all_partners',
        },

        target_agency_ids: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
        }],

        // Status
        status: {
            type: String,
            enum: ['draft', 'active', 'paused', 'expired', 'sold_out'],
            default: 'active',
            index: true,
        },

        // Metrics
        views_count: {
            type: Number,
            default: 0,
        },

        clicks_count: {
            type: Number,
            default: 0,
        },

        // Created by
        created_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        // Currency
        currency: {
            type: String,
            default: 'EUR',
            uppercase: true,
        },

        // Tags/Labels for categorization
        tags: [{
            type: String,
            trim: true,
        }],
    },
    {
        collection: 'flash_offers',
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    }
);

// Indexes
FlashOfferSchema.index({ hotel_org_id: 1, status: 1 });
FlashOfferSchema.index({ offer_expires_at: 1 });
FlashOfferSchema.index({ status: 1, offer_expires_at: 1 });
FlashOfferSchema.index({ property_id: 1, status: 1 });

// Pre-save: Auto-expire offers
FlashOfferSchema.pre('save', function (next) {
    const now = new Date();

    // Auto-expire if past expiration date
    if (this.offer_expires_at < now && this.status === 'active') {
        this.status = 'expired';
    }

    // Mark as sold out if no rooms left
    if (this.rooms_booked >= this.rooms_available && this.status === 'active') {
        this.status = 'sold_out';
    }

    next();
});

// Methods
FlashOfferSchema.methods.isActive = function () {
    const now = new Date();
    return (
        this.status === 'active' &&
        this.offer_expires_at > now &&
        this.rooms_booked < this.rooms_available
    );
};

FlashOfferSchema.methods.getRemainingRooms = function () {
    return Math.max(0, this.rooms_available - this.rooms_booked);
};

FlashOfferSchema.methods.bookRoom = async function (count = 1) {
    if (this.getRemainingRooms() < count) {
        throw new Error('Not enough rooms available');
    }
    this.rooms_booked += count;

    if (this.rooms_booked >= this.rooms_available) {
        this.status = 'sold_out';
    }

    return this.save();
};

FlashOfferSchema.methods.incrementView = async function () {
    this.views_count += 1;
    return this.save();
};

FlashOfferSchema.methods.incrementClick = async function () {
    this.clicks_count += 1;
    return this.save();
};

// Statics
FlashOfferSchema.statics.getActiveOffers = function (hotelOrgIds = null) {
    const now = new Date();
    const query = {
        status: 'active',
        offer_expires_at: { $gt: now },
    };

    if (hotelOrgIds) {
        query.hotel_org_id = { $in: hotelOrgIds };
    }

    return this.find(query)
        .populate('property_id', 'name address')
        .populate('room_type_id', 'name code capacity')
        .populate('hotel_org_id', 'name')
        .sort({ createdAt: -1 });
};

FlashOfferSchema.statics.getOffersForAgency = async function (agencyOrgId) {
    // Get connected hotel IDs
    const HotelAgencyPartnership = mongoose.model('HotelAgencyPartnership');
    const partnerships = await HotelAgencyPartnership.find({
        agency_org_id: agencyOrgId,
        status: 'active',
    }).select('hotel_org_id');

    const hotelIds = partnerships.map(p => p.hotel_org_id);

    if (hotelIds.length === 0) {
        return [];
    }

    const now = new Date();
    return this.find({
        hotel_org_id: { $in: hotelIds },
        status: 'active',
        offer_expires_at: { $gt: now },
        $or: [
            { target_type: 'all_partners' },
            { target_agency_ids: agencyOrgId },
        ],
    })
        .populate('property_id', 'name address')
        .populate('room_type_id', 'name code capacity')
        .populate('hotel_org_id', 'name')
        .sort({ discount_value: -1 }); // Highest discount first
};

FlashOfferSchema.statics.getOffersByHotel = function (hotelOrgId) {
    return this.find({ hotel_org_id: hotelOrgId })
        .populate('property_id', 'name')
        .populate('room_type_id', 'name code')
        .sort({ createdAt: -1 });
};

FlashOfferSchema.statics.expireOldOffers = async function () {
    const now = new Date();
    return this.updateMany(
        {
            status: 'active',
            offer_expires_at: { $lt: now },
        },
        {
            $set: { status: 'expired' },
        }
    );
};

module.exports = mongoose.model('FlashOffer', FlashOfferSchema);
