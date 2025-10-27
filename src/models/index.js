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
};