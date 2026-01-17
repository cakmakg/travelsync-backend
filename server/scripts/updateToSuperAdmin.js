/**
 * Update User to Super Admin Script
 * Updates an existing user to super_admin role
 * 
 * Usage: node server/scripts/updateToSuperAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const TARGET_EMAIL = 'admin@test.com';

async function updateToSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find and update user
        const user = await User.findOneAndUpdate(
            { email: TARGET_EMAIL },
            { role: 'super_admin' },
            { new: true }
        );

        if (user) {
            console.log('');
            console.log('🎉 User updated to Super Admin!');
            console.log('─'.repeat(40));
            console.log('📧 Email:', user.email);
            console.log('👤 Role:', user.role);
            console.log('🏢 Organization:', user.organization_id || 'None (System)');
            console.log('─'.repeat(40));
            console.log('');
            console.log('✅ You can now access /admin in the dashboard!');
        } else {
            console.log('❌ User not found:', TARGET_EMAIL);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Disconnected from MongoDB');
        process.exit(0);
    }
}

updateToSuperAdmin();
