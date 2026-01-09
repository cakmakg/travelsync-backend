"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Contract Routes
------------------------------------------------------- */

const router = require('express').Router();
const agencyContractController = require('../controllers/agencyContract');
const { authenticate, authorize } = require('../middlewares/auth');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/agency-contracts
 * @desc    Get all agency contracts
 * @access  Private (Admin, Manager)
 */
router.get('/', authorize('admin', 'manager'), agencyContractController.getAll);

/**
 * @route   GET /api/v1/agency-contracts/:id
 * @desc    Get agency contract by ID
 * @access  Private (Admin, Manager)
 */
router.get('/:id', authorize('admin', 'manager'), agencyContractController.getById);

/**
 * @route   POST /api/v1/agency-contracts
 * @desc    Create new agency contract
 * @access  Private (Admin only)
 */
router.post('/', authorize('admin'), agencyContractController.create);

/**
 * @route   PUT /api/v1/agency-contracts/:id
 * @desc    Update agency contract
 * @access  Private (Admin only)
 */
router.put('/:id', authorize('admin'), agencyContractController.update);

/**
 * @route   DELETE /api/v1/agency-contracts/:id
 * @desc    Soft delete agency contract
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('admin'), agencyContractController.delete);

/**
 * @route   GET /api/v1/agency-contracts/property/:propertyId/agency/:agencyId
 * @desc    Get active contract between property and agency
 * @access  Private (Admin, Manager)
 */
router.get('/property/:propertyId/agency/:agencyId', 
  authorize('admin', 'manager'), 
  agencyContractController.getActiveContract
);

/**
 * @route   POST /api/v1/agency-contracts/:id/activate
 * @desc    Activate contract (change status to ACTIVE)
 * @access  Private (Admin only)
 */
router.post('/:id/activate', authorize('admin'), agencyContractController.activate);

/**
 * @route   POST /api/v1/agency-contracts/:id/suspend
 * @desc    Suspend contract
 * @access  Private (Admin only)
 */
router.post('/:id/suspend', authorize('admin'), agencyContractController.suspend);

module.exports = router;