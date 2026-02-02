"use strict";
/* -------------------------------------------------------
    TravelSync - Hotel-Agency Partnership Model
    Organization-level B2B connection/invitation system
------------------------------------------------------- */

const { mongoose } = require('../config/database');
const crypto = require('crypto');

const HotelAgencyPartnershipSchema = new mongoose.Schema(
    {
        // Hotel organization (the one providing rooms)
        hotel_org_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Hotel organization ID is required'],
            index: true,
        },

        // Agency organization (the one booking rooms)
        agency_org_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Agency organization ID is required'],
            index: true,
        },

        // Partnership status
        status: {
            type: String,
            enum: ['pending', 'active', 'suspended', 'terminated'],
            default: 'pending',
            required: true,
            index: true,
        },

        // Who initiated the connection
        invited_by: {
            type: String,
            enum: ['hotel', 'agency'],
            required: true,
        },

        // Invitation details
        invitation_token: {
            type: String,
            unique: true,
            sparse: true,
        },

        invitation_email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        invitation_expires_at: {
            type: Date,
            default: function () {
                // 7 days from now
                const date = new Date();
                date.setDate(date.getDate() + 7);
                return date;
            },
        },

        // Default commission settings (can be overridden per property)
        default_commission: {
            rate: {
                type: Number,
                default: 10,
                min: [0, 'Commission rate cannot be negative'],
                max: [50, 'Commission rate cannot exceed 50%'],
            },
            type: {
                type: String,
                enum: ['percentage', 'fixed'],
                default: 'percentage',
            },
        },

        // Partnership dates
        partnership_start: {
            type: Date,
            default: null,
        },

        // Status change timestamps
        accepted_at: {
            type: Date,
            default: null,
        },

        suspended_at: {
            type: Date,
            default: null,
        },

        terminated_at: {
            type: Date,
            default: null,
        },

        termination_reason: {
            type: String,
            maxlength: [500, 'Termination reason cannot exceed 500 characters'],
        },

        // Notes
        notes: {
            type: String,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },

        // Created by user
        created_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        collection: 'hotel_agency_partnerships',
        timestamps: true,
    }
);

// Compound unique index: One partnership per hotel-agency pair
HotelAgencyPartnershipSchema.index(
    { hotel_org_id: 1, agency_org_id: 1 },
    { unique: true }
);
HotelAgencyPartnershipSchema.index({ invitation_token: 1 });
HotelAgencyPartnershipSchema.index({ invitation_email: 1 });

// Pre-save: Generate invitation token if not exists
HotelAgencyPartnershipSchema.pre('save', function (next) {
    if (!this.invitation_token && this.status === 'pending') {
        this.invitation_token = crypto.randomBytes(32).toString('hex');
    }
    next();
});

// Methods
HotelAgencyPartnershipSchema.methods.accept = async function () {
    this.status = 'active';
    this.accepted_at = new Date();
    this.partnership_start = new Date();
    this.invitation_token = undefined;
    return this.save();
};

HotelAgencyPartnershipSchema.methods.suspend = async function (reason) {
    this.status = 'suspended';
    this.suspended_at = new Date();
    if (reason) this.notes = reason;
    return this.save();
};

HotelAgencyPartnershipSchema.methods.terminate = async function (reason) {
    this.status = 'terminated';
    this.terminated_at = new Date();
    if (reason) this.termination_reason = reason;
    return this.save();
};

HotelAgencyPartnershipSchema.methods.reactivate = async function () {
    if (this.status === 'suspended') {
        this.status = 'active';
        this.suspended_at = null;
        return this.save();
    }
    throw new Error('Only suspended partnerships can be reactivated');
};

HotelAgencyPartnershipSchema.methods.isExpired = function () {
    return this.status === 'pending' && new Date() > this.invitation_expires_at;
};

// Statics
HotelAgencyPartnershipSchema.statics.findByHotel = function (hotelOrgId, includeTerminated = false) {
    const query = { hotel_org_id: hotelOrgId };
    if (!includeTerminated) {
        query.status = { $ne: 'terminated' };
    }
    return this.find(query)
        .populate('agency_org_id', 'name country contact')
        .sort({ createdAt: -1 });
};

HotelAgencyPartnershipSchema.statics.findByAgency = function (agencyOrgId, includeTerminated = false) {
    const query = { agency_org_id: agencyOrgId };
    if (!includeTerminated) {
        query.status = { $ne: 'terminated' };
    }
    return this.find(query)
        .populate('hotel_org_id', 'name country contact')
        .sort({ createdAt: -1 });
};

HotelAgencyPartnershipSchema.statics.findByToken = function (token) {
    return this.findOne({ invitation_token: token, status: 'pending' })
        .populate('hotel_org_id', 'name country')
        .populate('agency_org_id', 'name country');
};

HotelAgencyPartnershipSchema.statics.findActivePartnership = function (hotelOrgId, agencyOrgId) {
    return this.findOne({
        hotel_org_id: hotelOrgId,
        agency_org_id: agencyOrgId,
        status: 'active',
    });
};

HotelAgencyPartnershipSchema.statics.getConnectedAgencies = function (hotelOrgId) {
    return this.find({
        hotel_org_id: hotelOrgId,
        status: 'active',
    })
        .populate('agency_org_id', '_id name country contact')
        .select('agency_org_id default_commission partnership_start');
};

HotelAgencyPartnershipSchema.statics.getConnectedHotels = function (agencyOrgId) {
    return this.find({
        agency_org_id: agencyOrgId,
        status: 'active',
    })
        .populate('hotel_org_id', '_id name country contact')
        .select('hotel_org_id default_commission partnership_start');
};

module.exports = mongoose.model('HotelAgencyPartnership', HotelAgencyPartnershipSchema);
