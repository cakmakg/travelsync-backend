"use strict";
/* -------------------------------------------------------
    TravelSync - Room Type Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomType');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/room-types
 * @desc    Get all room types (with pagination, search, filter)
 * @access  Private
 */
router.get('/', authenticate, roomTypeController.getAll);

/**
 * @route   GET /api/v1/room-types/property/:propertyId
 * @desc    Get all room types for a property
 * @access  Private
 */
router.get('/property/:propertyId', authenticate, roomTypeController.getByProperty);

/**
 * @route   GET /api/v1/room-types/property/:propertyId/bookable
 * @desc    Get all bookable room types for a property
 * @access  Private
 */
router.get('/property/:propertyId/bookable', authenticate, roomTypeController.getBookable);

/**
 * @route   GET /api/v1/room-types/:id
 * @desc    Get room type by ID
 * @access  Private
 */
router.get('/:id', authenticate, roomTypeController.getById);

/**
 * @route   GET /api/v1/room-types/:id/stats
 * @desc    Get room type statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, roomTypeController.getStats);

/**
 * @route   POST /api/v1/room-types
 * @desc    Create new room type
 * @access  Private (Admin, Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), roomTypeController.create);

/**
 * @route   PUT /api/v1/room-types/:id
 * @desc    Update room type
 * @access  Private (Admin, Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), roomTypeController.update);

/**
 * @route   PUT /api/v1/room-types/:id/toggle-active
 * @desc    Toggle room type active status
 * @access  Private (Admin, Manager)
 */
router.put('/:id/toggle-active', authenticate, authorize('admin', 'manager'), roomTypeController.toggleActive);

/**
 * @route   PUT /api/v1/room-types/:id/toggle-bookable
 * @desc    Toggle room type bookable status
 * @access  Private (Admin, Manager)
 */
router.put('/:id/toggle-bookable', authenticate, authorize('admin', 'manager'), roomTypeController.toggleBookable);

/**
 * @route   PUT /api/v1/room-types/:id/amenities
 * @desc    Update room type amenities
 * @access  Private (Admin, Manager)
 */
router.put('/:id/amenities', authenticate, authorize('admin', 'manager'), roomTypeController.updateAmenities);

/**
 * @route   DELETE /api/v1/room-types/:id
 * @desc    Soft delete room type
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), roomTypeController.delete);

/**
 * @route   POST /api/v1/room-types/:id/restore
 * @desc    Restore soft deleted room type
 * @access  Private (Admin only)
 */
router.post('/:id/restore', authenticate, authorize('admin'), roomTypeController.restore);

module.exports = router;