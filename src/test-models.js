"use strict";
/* -------------------------------------------------------
    TravelSync - Test Models
------------------------------------------------------- */

require('dotenv').config();
const { connectDatabase } = require('./config/database');
const { Organization, User, Property, RoomType, RatePlan } = require('./models');

const testModels = async () => {
  try {
    console.log('🚀 Starting model tests...\n');

    // Connect to DB
    await connectDatabase();

    // Clean up test data
    console.log('🧹 Cleaning up old test data...');
    await Organization.deleteMany({ name: /^Test/ });
    await User.deleteMany({ email: /^test/ });
    await Property.deleteMany({ name: /^Test/ });
    await RoomType.deleteMany({ name: /^Test/ });
    await RatePlan.deleteMany({ name: /^Test/ });
    console.log('✅ Cleanup complete\n');

    // 1. Create Organization
    console.log('📦 Creating Organization...');
    const org = await Organization.create({
      type: 'HOTEL',
      name: 'Test Hotel Group',
      country: 'DE',
      timezone: 'Europe/Berlin',
      currency: 'EUR',
    });
    console.log(`✅ Organization created: ${org._id}`);
    console.log(`   Name: ${org.name}`);
    console.log(`   Type: ${org.type}\n`);

    // 2. Create User
    console.log('👤 Creating User...');
    const user = await User.create({
      organization_id: org._id,
      email: 'test@example.com',
      password: 'Test123456',
      first_name: 'Test',
      last_name: 'User',
      role: 'admin',
    });
    console.log(`✅ User created: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}\n`);

    // 3. Create Property
    console.log('🏨 Creating Property...');
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
    console.log(`✅ Property created: ${property._id}`);
    console.log(`   Name: ${property.name}`);
    console.log(`   Code: ${property.code}`);
    console.log(`   Address: ${property.address.city}, ${property.address.country}\n`);

    // 4. Create Room Type
    console.log('🛏️  Creating Room Type...');
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
    console.log(`✅ Room Type created: ${roomType._id}`);
    console.log(`   Code: ${roomType.code}`);
    console.log(`   Name: ${roomType.name}`);
    console.log(`   Capacity: ${roomType.capacity.adults} adults + ${roomType.capacity.children} children\n`);

    // 5. Create Rate Plan
    console.log('💰 Creating Rate Plan...');
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
    console.log(`✅ Rate Plan created: ${ratePlan._id}`);
    console.log(`   Code: ${ratePlan.code}`);
    console.log(`   Name: ${ratePlan.name}`);
    console.log(`   Meal Plan: ${ratePlan.meal_plan}\n`);

    // Test relationships with populate
    console.log('🔗 Testing Relationships...');
    const userWithOrg = await User.findById(user._id).populate('organization_id');
    console.log(`✅ User → Organization: ${userWithOrg.organization_id.name}`);

    const propertyWithRoomTypes = await Property.findById(property._id).populate('room_types');
    console.log(`✅ Property → Room Types: ${propertyWithRoomTypes.room_types.length} room type(s)`);

    const propertyWithRatePlans = await Property.findById(property._id).populate('rate_plans');
    console.log(`✅ Property → Rate Plans: ${propertyWithRatePlans.rate_plans.length} rate plan(s)\n`);

    // Summary
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║                                           ║');
    console.log('║   🎉 ALL MODELS WORKING PERFECTLY! 🎉   ║');
    console.log('║                                           ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   Organizations: ${await Organization.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Properties: ${await Property.countDocuments()}`);
    console.log(`   Room Types: ${await RoomType.countDocuments()}`);
    console.log(`   Rate Plans: ${await RatePlan.countDocuments()}\n`);

    console.log('💡 Next Steps:');
    console.log('   1. Check MongoDB Atlas to see the data');
    console.log('   2. Create auth routes & controllers');
    console.log('   3. Test API with Postman\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    if (error.errors) {
      console.error('\n📋 Validation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

// Run tests
testModels();