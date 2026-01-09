"use strict";
/* -------------------------------------------------------
    TravelSync - Review Routes (B2C)
    SKELETON: Temel altyapı hazır, implementasyon yapılacak
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');
// const { authenticate } = require('../middlewares/auth'); // TODO: Uncomment when implementing

/**
 * @route   GET /api/v1/reviews
 * @desc    Get all reviews
 * @access  Public (for property reviews)
 * @status  TODO: Implement
 */
router.get('/', reviewController.getAll);

/**
 * @route   GET /api/v1/reviews/:id
 * @desc    Get review by ID
 * @access  Public
 * @status  TODO: Implement
 */
router.get('/:id', reviewController.getById);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create review
 * @access  Private (Traveler only)
 * @status  TODO: Implement
 */
router.post('/', reviewController.create);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update review
 * @access  Private (Traveler only)
 * @status  TODO: Implement
 */
router.put('/:id', reviewController.update);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete review
 * @access  Private (Traveler only)
 * @status  TODO: Implement
 */
router.delete('/:id', reviewController.delete);

module.exports = router;

