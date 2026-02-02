/**
 * Database Reset and Seed Script
 * Deletes all data and creates fresh test data
 * Usage: node server/scripts/resetAndSeed.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');

// Models
const { User, Organization, Property, RoomType, RatePlan, Reservation } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelsync';

// Sample Data
const SAMPLE_DATA = {
    // Super Admin
    superAdmin: {
        email: 'superadmin@travelsync.com',
        password: 'SuperAdmin123!@#',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'super_admin',
    },

    // Hotel Organization & Admin
    hotel: {
        organization: {
            name: 'Grand Istanbul Hotel',
            type: 'HOTEL',
            country: 'TR',
            timezone: 'Europe/Istanbul',
            currency: 'EUR',
            is_active: true,
        },
        admin: {
            email: 'admin@grandistanbul.com',
            password: 'HotelAdmin123!@#',
            first_name: 'Mehmet',
            last_name: 'Yılmaz',
            role: 'admin',
            phone: '+90 212 555 0001',
        },
        property: {
            name: 'Grand Istanbul Hotel',
            code: 'GIH',
            property_type: 'hotel',
            star_rating: 5,
            total_rooms: 120,
            address: {
                street: 'Taksim Meydanı No:1',
                city: 'İstanbul',
                state: 'İstanbul',
                postal_code: '34437',
                country: 'TR',
            },
            contact: {
                phone: '+90 212 555 0000',
                email: 'info@grandistanbul.com',
                website: 'www.grandistanbul.com',
            },
            amenities: ['wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'airport_shuttle'],
            is_active: true,
        },
        roomTypes: [
            {
                name: 'Standard Room',
                code: 'STD',
                description: 'Comfortable room with city view',
                capacity: { adults: 2, children: 1 },
                bed_configuration: '1 Queen Bed',
                size_sqm: 25,
                total_quantity: 40,
                amenities: ['wifi', 'tv', 'minibar', 'safe', 'air_conditioning'],
            },
            {
                name: 'Deluxe Room',
                code: 'DLX',
                description: 'Spacious room with Bosphorus view',
                capacity: { adults: 2, children: 2 },
                bed_configuration: '1 King Bed',
                size_sqm: 35,
                total_quantity: 50,
                amenities: ['wifi', 'tv', 'minibar', 'safe', 'air_conditioning', 'sea_view'],
            },
            {
                name: 'Junior Suite',
                code: 'JST',
                description: 'Elegant suite with separate living area',
                capacity: { adults: 2, children: 2 },
                bed_configuration: '1 King Bed + 1 Sofa Bed',
                size_sqm: 50,
                total_quantity: 20,
                amenities: ['wifi', 'tv', 'minibar', 'safe', 'air_conditioning', 'bathtub', 'coffee_machine'],
            },
            {
                name: 'Executive Suite',
                code: 'EXE',
                description: 'Luxury suite with panoramic views',
                capacity: { adults: 3, children: 2 },
                bed_configuration: '1 King Bed + 2 Single Beds',
                size_sqm: 75,
                total_quantity: 10,
                amenities: ['wifi', 'tv', 'minibar', 'safe', 'air_conditioning', 'bathtub', 'coffee_machine', 'balcony'],
            },
        ],
        ratePlans: [
            {
                name: 'Room Only',
                code: 'RO',
                description: 'Room only, no meals included',
                meal_plan: 'RO',
                rate_type: 'public',
                cancellation_policy: {
                    type: 'flexible',
                    free_cancellation_until: 1,
                    penalty_percentage: 100,
                },
            },
            {
                name: 'Bed & Breakfast',
                code: 'BB',
                description: 'Room with breakfast included',
                meal_plan: 'BB',
                rate_type: 'public',
                cancellation_policy: {
                    type: 'moderate',
                    free_cancellation_until: 2,
                    penalty_percentage: 50,
                },
            },
            {
                name: 'Half Board',
                code: 'HB',
                description: 'Room with breakfast and dinner',
                meal_plan: 'HB',
                rate_type: 'public',
                cancellation_policy: {
                    type: 'non_refundable',
                    free_cancellation_until: 0,
                    penalty_percentage: 100,
                },
            },
        ],
    },

    // Sample Reservations
    reservations: [
        {
            guest: { name: 'John Smith', email: 'john.smith@email.com', phone: '+1 555 123 4567' },
            check_in_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            check_out_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            guests: { adults: 2, children: 0 },
            status: 'confirmed',
            source: 'DIRECT',
            currency: 'EUR',
            total_price: 267,
            total_with_tax: 315,
        },
        {
            guest: { name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '+49 30 123 4567' },
            check_in_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            check_out_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
            guests: { adults: 2, children: 1 },
            status: 'pending',
            source: 'EMAIL',
            currency: 'EUR',
            total_price: 516,
            total_with_tax: 609,
        },
        {
            guest: { name: 'Ahmed Al-Farsi', email: 'ahmed.alfarsi@email.com', phone: '+971 50 123 4567' },
            check_in_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            check_out_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            guests: { adults: 2, children: 2 },
            status: 'confirmed',
            source: 'OTA',
            currency: 'EUR',
            total_price: 756,
            total_with_tax: 892,
        },
    ],

    // Agency Organization & Admin
    agency: {
        organization: {
            name: 'Berlin Travel Agency',
            type: 'AGENCY',
            country: 'DE',
            timezone: 'Europe/Berlin',
            currency: 'EUR',
            is_active: true,
        },
        admin: {
            email: 'admin@berlintravel.de',
            password: 'AgencyAdmin123!@#',
            first_name: 'Hans',
            last_name: 'Mueller',
            role: 'admin',
            phone: '+49 30 123 4567',
        },
    },
};

async function resetAndSeed() {
    console.log('🚀 Database Reset & Seed Script Starting...\n');

    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Drop all collections
        console.log('🗑️  Dropping all collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`   - Dropped: ${collection.name}`);
        }
        console.log('✅ All collections dropped\n');

        // Create System Organization for Super Admin
        console.log('🏢 Creating System Organization...');
        const systemOrg = await Organization.create({
            name: 'TravelSync System',
            type: 'HOTEL',
            country: 'TR',
            timezone: 'Europe/Istanbul',
            currency: 'EUR',
            is_active: true,
        });
        console.log(`   ✅ System Org: ${systemOrg.name} (${systemOrg._id})\n`);

        // Create Super Admin
        console.log('👤 Creating Super Admin...');
        const superAdmin = await User.create({
            ...SAMPLE_DATA.superAdmin,
            organization_id: systemOrg._id,
            is_active: true,
            is_email_verified: true,
        });
        console.log(`   ✅ Super Admin: ${superAdmin.email}\n`);

        // Create Hotel Organization
        console.log('🏨 Creating Hotel Organization...');
        const hotelOrg = await Organization.create(SAMPLE_DATA.hotel.organization);
        console.log(`   ✅ Organization: ${hotelOrg.name} (${hotelOrg._id})\n`);

        // Create Hotel Admin
        console.log('👤 Creating Hotel Admin...');
        const hotelAdmin = await User.create({
            ...SAMPLE_DATA.hotel.admin,
            organization_id: hotelOrg._id,
            is_active: true,
            is_email_verified: true,
        });
        console.log(`   ✅ Hotel Admin: ${hotelAdmin.email}\n`);

        // Create Agency Organization
        console.log('🏢 Creating Agency Organization...');
        const agencyOrg = await Organization.create(SAMPLE_DATA.agency.organization);
        console.log(`   ✅ Agency: ${agencyOrg.name} (${agencyOrg._id})\n`);

        // Create Agency Admin
        console.log('👤 Creating Agency Admin...');
        const agencyAdmin = await User.create({
            ...SAMPLE_DATA.agency.admin,
            organization_id: agencyOrg._id,
            is_active: true,
            is_email_verified: true,
        });
        console.log(`   ✅ Agency Admin: ${agencyAdmin.email}\n`);

        // Create Partnership between Hotel and Agency
        console.log('🤝 Creating Hotel-Agency Partnership...');
        const HotelAgencyPartnership = require('../models/HotelAgencyPartnership');
        await HotelAgencyPartnership.create({
            hotel_org_id: hotelOrg._id,
            agency_org_id: agencyOrg._id,
            status: 'active',
            default_commission: {
                type: 'percentage',
                rate: 10,
            },
            invited_by: 'hotel',
            created_by_user_id: hotelAdmin._id,
            accepted_at: new Date(),
            partnership_start: new Date(),
        });
        console.log(`   ✅ Partnership: ${hotelOrg.name} <-> ${agencyOrg.name}\n`);

        // Create Property
        console.log('🏢 Creating Property...');
        const property = await Property.create({
            ...SAMPLE_DATA.hotel.property,
            organization_id: hotelOrg._id,
        });
        console.log(`   ✅ Property: ${property.name} (${property._id})\n`);

        // Create Room Types
        console.log('🛏️  Creating Room Types...');
        const roomTypes = [];
        for (const rtData of SAMPLE_DATA.hotel.roomTypes) {
            const roomType = await RoomType.create({
                ...rtData,
                property_id: property._id,
            });
            roomTypes.push(roomType);
            console.log(`   ✅ ${roomType.name} (${roomType.code})`);
        }
        console.log('');

        // Create Rate Plans
        console.log('💰 Creating Rate Plans...');
        const ratePlans = [];
        for (const rpData of SAMPLE_DATA.hotel.ratePlans) {
            const ratePlan = await RatePlan.create({
                ...rpData,
                property_id: property._id,
            });
            ratePlans.push(ratePlan);
            console.log(`   ✅ ${ratePlan.name} (${ratePlan.code})`);
        }
        console.log('');

        // Create Reservations
        console.log('📅 Creating Sample Reservations...');
        for (let i = 0; i < SAMPLE_DATA.reservations.length; i++) {
            const resData = SAMPLE_DATA.reservations[i];
            const roomType = roomTypes[i % roomTypes.length];
            const ratePlan = ratePlans[i % ratePlans.length];

            const reservation = await Reservation.create({
                ...resData,
                property_id: property._id,
                room_type_id: roomType._id,
                rate_plan_id: ratePlan._id,
                created_by_user_id: hotelAdmin._id,
            });
            console.log(`   ✅ ${reservation.booking_reference} - ${resData.guest.name}`);
        }
        console.log('');

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('                    ✅ SEED COMPLETE!                       ');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('📋 LOGIN CREDENTIALS:\n');
        console.log('┌──────────────────────────────────────────────────────────┐');
        console.log('│ SUPER ADMIN (System Access)                              │');
        console.log('├──────────────────────────────────────────────────────────┤');
        console.log(`│ Email:    ${SAMPLE_DATA.superAdmin.email.padEnd(38)}│`);
        console.log(`│ Password: ${SAMPLE_DATA.superAdmin.password.padEnd(38)}│`);
        console.log('└──────────────────────────────────────────────────────────┘\n');

        console.log('┌──────────────────────────────────────────────────────────┐');
        console.log('│ HOTEL ADMIN (Hotel Dashboard)                            │');
        console.log('├──────────────────────────────────────────────────────────┤');
        console.log(`│ Email:    ${SAMPLE_DATA.hotel.admin.email.padEnd(38)}│`);
        console.log(`│ Password: ${SAMPLE_DATA.hotel.admin.password.padEnd(38)}│`);
        console.log('└──────────────────────────────────────────────────────────┘\n');

        console.log('📊 DATA CREATED:');
        console.log(`   • 1 Super Admin`);
        console.log(`   • 1 Hotel Organization (Grand Istanbul Hotel)`);
        console.log(`   • 1 Hotel Admin`);
        console.log(`   • 1 Property`);
        console.log(`   • 4 Room Types`);
        console.log(`   • 3 Rate Plans`);
        console.log(`   • 3 Reservations`);
        console.log(`   • 1 Agency (Berlin Travel Agency)`);
        console.log(`   • 1 Partnership (Hotel <-> Agency)\n`);

        console.log('🌐 TEST URL: http://localhost:5173\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
        process.exit(0);
    }
}

resetAndSeed();
