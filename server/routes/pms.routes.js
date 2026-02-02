"use strict";
/* -------------------------------------------------------
    TravelSync - PMS Integration Routes
    Property-level PMS sync endpoints
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const pmsService = require('../services/pms.service');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/pms/:propertyId/status
 * @desc    Test PMS connection for a property
 * @access  Private (Admin)
 */
router.get('/:propertyId/status', authorize('admin'), asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const result = await pmsService.testConnection(propertyId);
    return res.success(result);
}));

/**
 * @route   POST /api/v1/pms/:propertyId/sync/inventory
 * @desc    Sync inventory from PMS to TravelSync
 * @access  Private (Admin)
 */
router.post('/:propertyId/sync/inventory', authorize('admin'), asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const result = await pmsService.syncInventory(propertyId);
    return res.success(result, { message: 'Inventory sync completed' });
}));

/**
 * @route   POST /api/v1/pms/:propertyId/sync/reservations
 * @desc    Sync reservations from PMS to TravelSync
 * @access  Private (Admin)
 * @body    { start_date, end_date }
 */
router.post('/:propertyId/sync/reservations', authorize('admin'), asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { start_date, end_date } = req.body;

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const result = await pmsService.syncReservations(propertyId, startDate, endDate);
    return res.success(result, { message: 'Reservation sync completed' });
}));

/**
 * @route   POST /api/v1/pms/:propertyId/sync/full
 * @desc    Full sync (inventory + reservations)
 * @access  Private (Admin)
 */
router.post('/:propertyId/sync/full', authorize('admin'), asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const inventoryResult = await pmsService.syncInventory(propertyId);
    const reservationResult = await pmsService.syncReservations(
        propertyId,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    return res.success({
        inventory: inventoryResult,
        reservations: reservationResult,
    }, { message: 'Full sync completed' });
}));

module.exports = router;
