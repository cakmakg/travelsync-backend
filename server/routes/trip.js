"use strict";
/* -------------------------------------------------------
    TravelSync - Trip Routes (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip');
// const { authenticate } = require('../middlewares/auth'); // TODO: Uncomment when implementing

/**
 * @route   GET /api/v1/trips
 * @desc    Get all trips
 * @access  Private
 * @status  TODO: Implement
 */
router.get('/', tripController.getAll);

/**
 * @route   GET /api/v1/trips/:id
 * @desc    Get trip by ID
 * @access  Private
 * @status  TODO: Implement
 */
router.get('/:id', tripController.getById);

/**
 * @route   POST /api/v1/trips
 * @desc    Create trip
 * @access  Private
 * @status  TODO: Implement
 */
router.post('/', tripController.create);

/**
 * @route   PUT /api/v1/trips/:id
 * @desc    Update trip
 * @access  Private
 * @status  TODO: Implement
 */
router.put('/:id', tripController.update);

/**
 * @route   DELETE /api/v1/trips/:id
 * @desc    Delete trip
 * @access  Private
 * @status  TODO: Implement
 */
router.delete('/:id', tripController.delete);

module.exports = router;

