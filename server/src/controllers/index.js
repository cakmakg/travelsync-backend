"use strict";
/* -------------------------------------------------------
    TravelSync - Controllers Index
    Central export point for all controllers
------------------------------------------------------- */

module.exports = {
  // B2B Controllers
  organizationController: require('./organization'),
  userController: require('./user'),
  propertyController: require('./property'),
  roomTypeController: require('./roomType'),
  ratePlanController: require('./ratePlan'),
  priceController: require('./price'),
  inventoryController: require('./inventory'),
  reservationController: require('./reservation'),
  agencyController: require('./agency'),
  agencyContractController: require('./agencyContract'),
  authController: require('./auth'),
  
  // B2C Controllers (Skeleton - Ready for future implementation)
  travelerController: require('./traveler'),
  tripController: require('./trip'),
  reviewController: require('./review'),
};
