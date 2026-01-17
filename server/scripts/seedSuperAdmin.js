/**
 * Super Admin Seed Script
 * Creates a super admin user for system management
 * 
 * Usage: node server/scripts/seedSuperAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('../models/User');

const SUPER_ADMIN = {
    email: 'superadmin@travelsync.com',
    password: 'SuperAdmin123!',
    first_name: 'System',
    last_name: 'Administrator',
    role: 'super_admin',
    organization_id: null, // Super admin has no organization
    is_active: true,
    is_email_verified: true,
};

async function seedSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if super admin already exists
        const existingAdmin = await User.findOne({ email: SUPER_ADMIN.email });
        if (existingAdmin) {
            console.log('⚠️ Super admin already exists:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, salt);

        // Create super admin
        const superAdmin = new User({
            ...SUPER_ADMIN,
            password: hashedPassword,
        });

        await superAdmin.save();

        console.log('');
        console.log('🎉 Super Admin created successfully!');
        console.log('─'.repeat(40));
        console.log('📧 Email:', SUPER_ADMIN.email);
        console.log('🔑 Password:', SUPER_ADMIN.password);
        console.log('👤 Role:', SUPER_ADMIN.role);
        console.log('─'.repeat(40));
        console.log('');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
        console.log('');

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedSuperAdmin();
