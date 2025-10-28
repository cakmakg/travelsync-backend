"use strict";
/* -------------------------------------------------------
    TravelSync - Routes Index
------------------------------------------------------- */

/**
 * Export all route modules
 * 
 * Usage:
 * const routes = require('./routes');
 * app.use('/api/v1/auth', routes.auth);
 * app.use('/api/v1/organizations', routes.organization);
 * ...
 */

module.exports = {
  auth: require('./auth'),
  organization: require('./organization'),
  user: require('./user'),
  property: require('./property'),
  roomType: require('./roomType'),
  ratePlan: require('./ratePlan'),
  price: require('./price'),
  inventory: require('./inventory'),
  reservation: require('./reservation'),
};