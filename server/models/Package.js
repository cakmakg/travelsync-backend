"use strict";
/* -------------------------------------------------------
    TravelSync - Package Model (B2B - Agency)
    Agency tarafından oluşturulan paket turlar
------------------------------------------------------- */

const { mongoose } = require('../config/database');

const PackageSchema = new mongoose.Schema(
    {
        // Agency who created this package
        agency_org_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Agency organization ID is required'],
            index: true,
        },

        // Created by user
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Package Details
        name: {
            type: String,
            required: [true, 'Package name is required'],
            trim: true,
            maxlength: [200, 'Name cannot exceed 200 characters'],
        },

        code: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: [20, 'Code cannot exceed 20 characters'],
        },

        description: {
            type: String,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },

        // Package Type
        package_type: {
            type: String,
            enum: ['city_break', 'beach', 'cultural', 'adventure', 'wellness', 'ski', 'cruise', 'custom'],
            default: 'custom',
        },

        // Destination
        destination: {
            country: String,
            city: String,
            region: String,
        },

        // Duration
        duration: {
            nights: {
                type: Number,
                required: [true, 'Number of nights is required'],
                min: [1, 'Minimum 1 night required'],
            },
            days: {
                type: Number,
                default: function () {
                    return this.duration?.nights ? this.duration.nights + 1 : 1;
                },
            },
        },

        // Accommodation
        accommodation: [{
            hotel_org_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Organization',
            },
            property_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Property',
            },
            room_type_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'RoomType',
            },
            hotel_name: String,
            room_name: String,
            nights: Number,
            day_start: Number, // Which day of package (1, 2, 3...)
            board_type: {
                type: String,
                enum: ['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive'],
                default: 'breakfast',
            },
            price_per_night: Number,
        }],

        // Transfers
        transfers: [{
            type: {
                type: String,
                enum: ['airport_pickup', 'airport_dropoff', 'intercity', 'excursion'],
            },
            description: String,
            from_location: String,
            to_location: String,
            vehicle_type: {
                type: String,
                enum: ['private_car', 'shared_shuttle', 'private_van', 'bus'],
                default: 'private_car',
            },
            day: Number,
            price: Number,
            included: {
                type: Boolean,
                default: true,
            },
        }],

        // Activities / Excursions
        activities: [{
            name: String,
            description: String,
            day: Number,
            duration_hours: Number,
            location: String,
            price: Number,
            included: {
                type: Boolean,
                default: true,
            },
        }],

        // Meals (extra beyond board type)
        meals: [{
            type: {
                type: String,
                enum: ['lunch', 'dinner', 'special_dinner'],
            },
            description: String,
            restaurant: String,
            day: Number,
            price: Number,
            included: {
                type: Boolean,
                default: true,
            },
        }],

        // Pricing
        pricing: {
            currency: {
                type: String,
                default: 'EUR',
            },
            base_price: {
                type: Number,
                default: 0,
            },
            // Per person pricing
            price_adult: {
                type: Number,
                required: [true, 'Adult price is required'],
            },
            price_child: {
                type: Number,
                default: 0,
            },
            price_infant: {
                type: Number,
                default: 0,
            },
            // Supplements
            single_supplement: {
                type: Number,
                default: 0,
            },
            // What's included in price
            includes_transfers: {
                type: Boolean,
                default: true,
            },
            includes_activities: {
                type: Boolean,
                default: true,
            },
        },

        // Capacity
        capacity: {
            min_participants: {
                type: Number,
                default: 1,
            },
            max_participants: {
                type: Number,
                default: 20,
            },
        },

        // Validity
        valid_from: {
            type: Date,
            required: [true, 'Valid from date is required'],
        },
        valid_to: {
            type: Date,
            required: [true, 'Valid to date is required'],
        },

        // Blackout dates
        blackout_dates: [Date],

        // Status
        status: {
            type: String,
            enum: ['draft', 'active', 'paused', 'expired', 'archived'],
            default: 'draft',
            index: true,
        },

        // Terms
        terms_conditions: String,
        cancellation_policy: String,

        // Images
        images: [String],

        // Stats
        stats: {
            views: {
                type: Number,
                default: 0,
            },
            bookings: {
                type: Number,
                default: 0,
            },
            revenue: {
                type: Number,
                default: 0,
            },
        },

        // Commission if shared with other agencies
        allow_reselling: {
            type: Boolean,
            default: false,
        },
        reseller_commission: {
            type: Number,
            default: 5,
            min: 0,
            max: 30,
        },
    },
    {
        timestamps: true,
        collection: 'packages',
    }
);

// Indexes
PackageSchema.index({ agency_org_id: 1, status: 1 });
PackageSchema.index({ 'destination.country': 1, 'destination.city': 1 });
PackageSchema.index({ valid_from: 1, valid_to: 1 });
PackageSchema.index({ package_type: 1, status: 1 });
PackageSchema.index({ 'pricing.price_adult': 1 });

// Virtual: Total calculated price
PackageSchema.virtual('calculated_total').get(function () {
    let total = 0;

    // Accommodation
    if (this.accommodation && this.accommodation.length > 0) {
        this.accommodation.forEach(acc => {
            total += (acc.price_per_night || 0) * (acc.nights || 1);
        });
    }

    // Transfers
    if (this.transfers && this.transfers.length > 0) {
        this.transfers.forEach(t => {
            if (t.included) total += t.price || 0;
        });
    }

    // Activities
    if (this.activities && this.activities.length > 0) {
        this.activities.forEach(a => {
            if (a.included) total += a.price || 0;
        });
    }

    // Meals
    if (this.meals && this.meals.length > 0) {
        this.meals.forEach(m => {
            if (m.included) total += m.price || 0;
        });
    }

    return total;
});

// Pre-save: Auto-generate code if not provided
PackageSchema.pre('save', function (next) {
    if (!this.code) {
        const prefix = this.package_type ? this.package_type.substring(0, 3).toUpperCase() : 'PKG';
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.code = `${prefix}-${random}`;
    }

    // Calculate days from nights
    if (this.duration && this.duration.nights) {
        this.duration.days = this.duration.nights + 1;
    }

    next();
});

// Static: Find active packages by agency
PackageSchema.statics.findByAgency = function (agencyOrgId, includeAll = false) {
    const query = { agency_org_id: agencyOrgId };
    if (!includeAll) {
        query.status = { $in: ['draft', 'active', 'paused'] };
    }
    return this.find(query).sort({ updatedAt: -1 });
};

// Static: Search packages
PackageSchema.statics.searchPackages = function (filters = {}) {
    const query = { status: 'active' };

    if (filters.destination_country) {
        query['destination.country'] = filters.destination_country;
    }
    if (filters.destination_city) {
        query['destination.city'] = new RegExp(filters.destination_city, 'i');
    }
    if (filters.package_type) {
        query.package_type = filters.package_type;
    }
    if (filters.min_nights) {
        query['duration.nights'] = { $gte: filters.min_nights };
    }
    if (filters.max_nights) {
        query['duration.nights'] = { ...query['duration.nights'], $lte: filters.max_nights };
    }
    if (filters.max_price) {
        query['pricing.price_adult'] = { $lte: filters.max_price };
    }

    return this.find(query).sort({ 'pricing.price_adult': 1 });
};

// Method: Publish package
PackageSchema.methods.publish = function () {
    this.status = 'active';
    return this.save();
};

// Method: Pause package
PackageSchema.methods.pause = function () {
    this.status = 'paused';
    return this.save();
};

// Method: Archive package
PackageSchema.methods.archive = function () {
    this.status = 'archived';
    return this.save();
};

// Method: Increment stats
PackageSchema.methods.incrementView = function () {
    this.stats.views += 1;
    return this.save();
};

PackageSchema.methods.recordBooking = function (amount) {
    this.stats.bookings += 1;
    this.stats.revenue += amount || 0;
    return this.save();
};

// Ensure virtuals are included in JSON
PackageSchema.set('toJSON', { virtuals: true });
PackageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Package', PackageSchema);
