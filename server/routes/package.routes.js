"use strict";
/* -------------------------------------------------------
    TravelSync - Package Routes
    Agency paket oluşturma ve yönetimi
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const {
    getPackages,
    getPackage,
    createPackage,
    updatePackage,
    deletePackage,
    publishPackage,
    pausePackage,
    duplicatePackage,
    getPackageStats,
} = require('../controllers/package.controller');

const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Stats route (must be before :id routes)
router.get('/stats', getPackageStats);

// CRUD routes
router.route('/')
    .get(getPackages)
    .post(createPackage);

router.route('/:id')
    .get(getPackage)
    .put(updatePackage)
    .delete(deletePackage);

// Action routes
router.post('/:id/publish', publishPackage);
router.post('/:id/pause', pausePackage);
router.post('/:id/duplicate', duplicatePackage);

module.exports = router;
