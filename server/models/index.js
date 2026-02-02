"use strict";
/* -------------------------------------------------------
    TravelSync - Models Index
    Central export point for all models
------------------------------------------------------- */

module.exports = {
  Organization: require('./Organization'),
  User: require('./User'),
  Property: require('./Property'),
  RoomType: require('./Roomtype'),
  RatePlan: require('./Rateplan'),
  Price: require('./Price'),
  Inventory: require('./Inventory'),
  Reservation: require('./Reservation'),
  AuditLog: require('./Auditlog'),
  Agency: require('./Agency'),
  AgencyContract: require('./AgencyContract'),
  HotelAgencyPartnership: require('./HotelAgencyPartnership'),
  FlashOffer: require('./FlashOffer'),
  // B2C Models (Skeleton - Ready for future implementation)
  Traveler: require('./Traveler'),
  Trip: require('./Trip'),
  Payment: require('./Payment'),
  Review: require('./Review'),
  Wishlist: require('./Wishlist'),
  TokenBlacklist: require('./TokenBlacklist'),
};