"use strict";
/* -------------------------------------------------------
    TravelSync - Traveler Routes (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const travelerController = require('../controllers/traveler');
// const { authenticate } = require('../middlewares/auth'); // TODO: Uncomment when implementing

/**
 * @route   GET /api/v1/travelers
 * @desc    Get all travelers
 * @access  Private (Admin only - future)
 * @status  TODO: Implement
 */
router.get('/', travelerController.getAll);

/**
 * @route   GET /api/v1/travelers/:id
 * @desc    Get traveler by ID
 * @access  Private
 * @status  TODO: Implement
 */
router.get('/:id', travelerController.getById);

/**
 * @route   POST /api/v1/travelers
 * @desc    Create traveler (register)
 * @access  Public
 * @status  TODO: Implement
 */
router.post('/', travelerController.create);

/**
 * @route   PUT /api/v1/travelers/:id
 * @desc    Update traveler
 * @access  Private
 * @status  TODO: Implement
 */
router.put('/:id', travelerController.update);

/**
 * @route   DELETE /api/v1/travelers/:id
 * @desc    Delete traveler
 * @access  Private
 * @status  TODO: Implement
 */
router.delete('/:id', travelerController.delete);

/**
 * @route   GET /api/v1/travelers/:id/trips
 * @desc    Get traveler trips
 * @access  Private
 * @status  TODO: Implement
 */
router.get('/:id/trips', travelerController.getTrips);

/**
 * @route   GET /api/v1/travelers/:id/wishlist
 * @desc    Get traveler wishlist
 * @access  Private
 * @status  TODO: Implement
 */
router.get('/:id/wishlist', travelerController.getWishlist);

/**
 * @route   GET /api/v1/travelers/:id/reviews
 * @desc    Get traveler reviews
 * @access  Private
 * @status  TODO: Implement
 */
router.get('/:id/reviews', travelerController.getReviews);

module.exports = router;

