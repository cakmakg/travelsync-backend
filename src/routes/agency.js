"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Routes
------------------------------------------------------- */

const router = require('express').Router();
const controller = require('../controllers/agency');
const asyncHandler = require('../middlewares/');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// CRUD
router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', authorize('admin'), asyncHandler(controller.create));
router.put('/:id', authorize('admin'), asyncHandler(controller.update));
router.delete('/:id', authorize('admin'), asyncHandler(controller.delete));

// Agency specific
router.get('/:id/bookings', asyncHandler(controller.getBookings));
router.get('/:id/commission-report', asyncHandler(controller.getCommissionReport));
router.post('/:id/mark-commission-paid', authorize('admin'), asyncHandler(controller.markCommissionPaid));

module.exports = router;