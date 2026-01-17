"use strict";
/* -------------------------------------------------------
    TravelSync - User Model
------------------------------------------------------- */

const { mongoose } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { isValidEmail } = require('../utils/email');

const UserSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'Email address is required'],
      validate: [
        (email) => isValidEmail(email),
        'Email format is not valid',
      ],
    },

    password: {
      type: String,
      trim: true,
      required: [true, 'Password is required'],
      select: false, // Don't return password by default
    },

    first_name: {
      type: String,
      trim: true,
      required: [true, 'First name is required'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    last_name: {
      type: String,
      trim: true,
      required: [true, 'Last name is required'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'admin',
      required: true,
    },

    // Permissions (fine-grained access control)
    permissions: {
      reservations: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      prices: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      inventory: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      reports: {
        read: { type: Boolean, default: false },
      },
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    last_login: {
      type: Date,
      default: null,
    },

    // Password reset
    reset_password_token: {
      type: String,
      select: false,
    },

    reset_password_expires: {
      type: Date,
      select: false,
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },

    // Soft delete
    deleted_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

// Compound unique index: email must be unique within organization
UserSchema.index({ organization_id: 1, email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ is_active: 1 });

// Virtual: Full name
UserSchema.virtual('full_name').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Methods
UserSchema.methods.updateLastLogin = function () {
  this.last_login = new Date();
  return this.save();
};

UserSchema.methods.hasPermission = function (resource, action) {
  // Check if user has specific permission
  if (this.role === 'admin') return true; // Admin has all permissions
  return this.permissions[resource]?.[action] || false;
};

// Pre-save hook: Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Statics
UserSchema.statics.findByOrganization = function (organizationId) {
  return this.find({ organization_id: organizationId, is_active: true });
};

module.exports = mongoose.model('User', UserSchema);