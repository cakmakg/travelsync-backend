"use strict";
/* -------------------------------------------------------
    TravelSync - Routes Index
    Central export point for all routes
------------------------------------------------------- */

module.exports = {
  // B2B Routes
  auth: require('./auth'),
  organization: require('./organization'),
  user: require('./user'),
  property: require('./property'),
  roomType: require('./roomType'),
  ratePlan: require('./ratePlan'),
  price: require('./price'),
  inventory: require('./inventory'),
  reservation: require('./reservation'),
  agency: require('./agency'),
  agencyContract: require('./agencyContract'),
  admin: require('./admin'),
  partnership: require('./partnership'),
  flashOfferB2B: require('./flashOfferB2B'),

  // B2C Routes (Skeleton - Ready for future implementation)
  traveler: require('./traveler'),
  trip: require('./trip'),
  review: require('./review'),
};
