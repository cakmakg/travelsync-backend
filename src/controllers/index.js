/**
 * 🎯 CONTROLLERS INDEX
 * 
 * Export all controllers from a single file
 */

// Base controller (optional export)
const BaseController = require('./base');

// Simple CRUD controllers
const organizationController = require('./organization');
const userController = require('./user');
const propertyController = require('./property');
const roomTypeController = require('./roomType');
const ratePlanController = require('./ratePlan');

// Complex controllers with services
const priceController = require('./price');
const inventoryController = require('./inventory');
const reservationController = require('./reservation');

module.exports = {
  BaseController,
  organizationController,
  userController,
  propertyController,
  roomTypeController,
  ratePlanController,
  priceController,
  inventoryController,
  reservationController
};