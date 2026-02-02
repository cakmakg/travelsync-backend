"use strict";
/* -------------------------------------------------------
    TravelSync - Partnership Routes
    Hotel-Agency B2B connection endpoints
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const partnershipController = require('../controllers/partnership.controller');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/partnerships
 * @desc    Get all partnerships for current organization
 * @access  Private
 */
router.get('/', authenticate, partnershipController.getAll);

/**
 * @route   GET /api/v1/partnerships/connected
 * @desc    Get list of active connected partners
 * @access  Private
 */
router.get('/connected', authenticate, partnershipController.getConnectedPartners);

/**
 * @route   POST /api/v1/partnerships/invite
 * @desc    Invite a partner (hotel invites agency or vice versa)
 * @access  Private (Admin, Manager)
 */
router.post('/invite', authenticate, authorize('admin', 'manager'), partnershipController.invite);

/**
 * @route   PUT /api/v1/partnerships/:id/accept
 * @desc    Accept a partnership invitation
 * @access  Private (Admin, Manager)
 */
router.put('/:id/accept', authenticate, authorize('admin', 'manager'), partnershipController.accept);

/**
 * @route   PUT /api/v1/partnerships/:id/reject
 * @desc    Reject a partnership invitation
 * @access  Private (Admin, Manager)
 */
router.put('/:id/reject', authenticate, authorize('admin', 'manager'), partnershipController.reject);

/**
 * @route   PUT /api/v1/partnerships/:id/suspend
 * @desc    Suspend an active partnership
 * @access  Private (Admin)
 */
router.put('/:id/suspend', authenticate, authorize('admin'), partnershipController.suspend);

/**
 * @route   PUT /api/v1/partnerships/:id/reactivate
 * @desc    Reactivate a suspended partnership
 * @access  Private (Admin)
 */
router.put('/:id/reactivate', authenticate, authorize('admin'), partnershipController.reactivate);

/**
 * @route   PUT /api/v1/partnerships/:id/terminate
 * @desc    Terminate a partnership
 * @access  Private (Admin)
 */
router.put('/:id/terminate', authenticate, authorize('admin'), partnershipController.terminate);

/**
 * @route   GET /api/v1/partnerships/accept/:token
 * @desc    Accept invitation via token (public link)
 * @access  Private (requires login)
 */
router.get('/accept/:token', authenticate, partnershipController.acceptByToken);

module.exports = router;
