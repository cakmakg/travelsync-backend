"use strict";
/* -------------------------------------------------------
    TravelSync - Admin Routes
    Super Admin endpoints for system management
------------------------------------------------------- */

const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/admin');

// All routes require super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// Statistics
router.get('/stats', adminController.getStats);

// Organizations
router.get('/organizations', adminController.getOrganizations);
router.patch('/organizations/:id/status', adminController.updateOrganizationStatus);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

module.exports = router;
