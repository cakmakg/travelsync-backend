"use strict";
/**
 * Jest Test Setup - MongoDB Memory Server
 * Creates an in-memory MongoDB instance for integration tests
 */

const { MongoMemoryServer } = require("mongodb-memory-server");
const { mongoose } = require("../server/config/database");

let mongoServer;

/**
 * Connect to the in-memory database before all tests
 */
beforeAll(async () => {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Create in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);
});

/**
 * Clear all collections between tests
 */
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

/**
 * Close database connection and stop MongoDB server after all tests
 */
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});
