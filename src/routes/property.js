"use strict";
/* -------------------------------------------------------
    TravelSync - Property Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/properties
 * @desc    Get all properties (with pagination, search, filter)
 * @access  Private
 */
router.get('/', authenticate, propertyController.getAll);

/**
 * @route   GET /api/v1/properties/city/:city
 * @desc    Get properties by city
 * @access  Private
 */
router.get('/city/:city', authenticate, propertyController.getByCity);

/**
 * @route   GET /api/v1/properties/country/:country
 * @desc    Get properties by country
 * @access  Private
 */
router.get('/country/:country', authenticate, propertyController.getByCountry);

/**
 * @route   GET /api/v1/properties/rating/:rating
 * @desc    Get properties by star rating
 * @access  Private
 */
router.get('/rating/:rating', authenticate, propertyController.getByRating);

/**
 * @route   GET /api/v1/properties/:id
 * @desc    Get property by ID
 * @access  Private
 */
router.get('/:id', authenticate, propertyController.getById);

/**
 * @route   GET /api/v1/properties/:id/address
 * @desc    Get formatted full address
 * @access  Private
 */
router.get('/:id/address', authenticate, propertyController.getFullAddress);

/**
 * @route   GET /api/v1/properties/:id/stats
 * @desc    Get property statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, propertyController.getStats);

/**
 * @route   POST /api/v1/properties
 * @desc    Create new property
 * @access  Private (Admin, Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), propertyController.create);

/**
 * @route   PUT /api/v1/properties/:id
 * @desc    Update property
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), propertyController.update);

/**
 * @route   PUT /api/v1/properties/:id/amenities
 * @desc    Update property amenities
 * @access  Private (Admin, Manager)
 */
router.put('/:id/amenities', authenticate, authorize('admin', 'manager'), propertyController.updateAmenities);

/**
 * @route   DELETE /api/v1/properties/:id
 * @desc    Soft delete property
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), propertyController.delete);

/**
 * @route   POST /api/v1/properties/:id/restore
 * @desc    Restore soft deleted property
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), propertyController.restore);

module.exports = router;