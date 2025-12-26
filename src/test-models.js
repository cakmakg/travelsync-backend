"use strict";
/* -------------------------------------------------------
    TravelSync - Test Models
------------------------------------------------------- */

require('dotenv').config();
const logger = require('./config/logger');
const { connectDatabase } = require('./config/database');
const { Organization, User, Property, RoomType, RatePlan } = require('./models');

const testModels = async () => {
  try {
    logger.info('🚀 Starting model tests...');

    // Connect to DB
    await connectDatabase();

    // Clean up test data
    logger.info('🧹 Cleaning up old test data...');
    await Organization.deleteMany({ name: /^Test/ });
    await User.deleteMany({ email: /^test/ });
    await Property.deleteMany({ name: /^Test/ });
    await RoomType.deleteMany({ name: /^Test/ });
    await RatePlan.deleteMany({ name: /^Test/ });
    logger.info('✅ Cleanup complete');

    // 1. Create Organization
    logger.info('📦 Creating Organization...');
    const org = await Organization.create({
      type: 'HOTEL',
      name: 'Test Hotel Group',
      country: 'DE',
      timezone: 'Europe/Berlin',
      currency: 'EUR',
    });
    logger.info(`✅ Organization created: ${org._id}`);
    logger.info(`   Name: ${org.name}`);
    logger.info(`   Type: ${org.type}`);

    // 2. Create User
    logger.info('👤 Creating User...');
    const user = await User.create({
      organization_id: org._id,
      email: 'test@example.com',
      password: 'Test123456',
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
    });
    logger.info(`✅ User created: ${user._id}`);
    logger.info(`   Email: ${user.email}`);
    logger.info(`   Name: ${user.first_name} ${user.last_name}`);
    logger.info(`   Role: ${user.role}`);

    // 3. Create Property
    logger.info('🏨 Creating Property...');
    const property = await Property.create({
      organization_id: org._id,
      name: 'Test Hotel Munich',
      code: 'TEST-01',
      address: {
        street: 'Test Street 1',
        city: 'Munich',
        postal_code: '80000',
        country: 'DE',
      },
      star_rating: 4,
      total_rooms: 10,
      amenities: ['wifi', 'parking', 'gym'],
      contact: {
        email: 'info@testhotel.com',
        phone: '+49 89 12345678',
      },
    });
    logger.info(`✅ Property created: ${property._id}`);
    logger.info(`   Name: ${property.name}`);
    logger.info(`   Code: ${property.code}`);
    logger.info(`   Address: ${property.address.city}, ${property.address.country}`);

    // 4. Create Room Type
    logger.info('🛏️  Creating Room Type...');
    const roomType = await RoomType.create({
      property_id: property._id,
      code: 'STD',
      name: 'Test Standard Room',
      capacity: {
        adults: 2,
        children: 1,
      },
      bed_configuration: '1 King Bed',
      size_sqm: 25,
      total_quantity: 10,
      amenities: ['balcony', 'wifi', 'tv'],
    });
    logger.info(`✅ Room Type created: ${roomType._id}`);
    logger.info(`   Code: ${roomType.code}`);
    logger.info(`   Name: ${roomType.name}`);
    logger.info(`   Capacity: ${roomType.capacity.adults} adults + ${roomType.capacity.children} children`);

    // 5. Create Rate Plan
    logger.info('💰 Creating Rate Plan...');
    const ratePlan = await RatePlan.create({
      property_id: property._id,
      code: 'BAR',
      name: 'Test Best Available Rate',
      rate_type: 'public',
      meal_plan: 'BB',
      cancellation_policy: {
        type: 'flexible',
        free_cancellation_until: 1,
        penalty_percentage: 100,
        no_show_penalty: 100,
      },
      min_nights: 1,
    });
    logger.info(`✅ Rate Plan created: ${ratePlan._id}`);
    logger.info(`   Code: ${ratePlan.code}`);
    logger.info(`   Name: ${ratePlan.name}`);
    logger.info(`   Meal Plan: ${ratePlan.meal_plan}`);

    // Test relationships with populate
    logger.info('🔗 Testing Relationships...');
    const userWithOrg = await User.findById(user._id).populate('organization_id');
    logger.info(`✅ User → Organization: ${userWithOrg.organization_id.name}`);

    const propertyWithRoomTypes = await Property.findById(property._id).populate('room_types');
    logger.info(`✅ Property → Room Types: ${propertyWithRoomTypes.room_types.length} room type(s)`);

    const propertyWithRatePlans = await Property.findById(property._id).populate('rate_plans');
    logger.info(`✅ Property → Rate Plans: ${propertyWithRatePlans.rate_plans.length} rate plan(s)`);

    // Summary
    logger.info('╔═══════════════════════════════════════════╗');
    logger.info('║                                           ║');
    logger.info('║   🎉 ALL MODELS WORKING PERFECTLY! 🎉   ║');
    logger.info('║                                           ║');
    logger.info('╚═══════════════════════════════════════════╝');

    logger.info('📊 Summary:');
    logger.info(`   Organizations: ${await Organization.countDocuments()}`);
    logger.info(`   Users: ${await User.countDocuments()}`);
    logger.info(`   Properties: ${await Property.countDocuments()}`);
    logger.info(`   Room Types: ${await RoomType.countDocuments()}`);
    logger.info(`   Rate Plans: ${await RatePlan.countDocuments()}`);

    logger.info('💡 Next Steps:');
    logger.info('   1. Check MongoDB Atlas to see the data');
    logger.info('   2. Create auth routes & controllers');
    logger.info('   3. Test API with Postman');

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Test Error: ${error.message}`);
    if (error.errors) {
      logger.error('\n📋 Validation Errors:');
      Object.keys(error.errors).forEach(key => {
        logger.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

// Run tests
testModels();