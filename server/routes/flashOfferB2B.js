"use strict";
/* -------------------------------------------------------
    TravelSync - Flash Offer B2B Routes
    Hotel flash offers visible to partner agencies
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const flashOfferController = require('../controllers/flashOfferB2B.controller');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/flash-offers-b2b
 * @desc    Get flash offers (hotel's own or agency's available)
 * @access  Private
 */
router.get('/', authenticate, flashOfferController.getMyOffers);

/**
 * @route   GET /api/v1/flash-offers-b2b/agency
 * @desc    Get flash offers available for agency (from connected hotels)
 * @access  Private (Agency only)
 */
router.get('/agency', authenticate, flashOfferController.getOffersForAgency);

/**
 * @route   GET /api/v1/flash-offers-b2b/stats
 * @desc    Get flash offer statistics for hotel
 * @access  Private (Hotel Admin/Manager)
 */
router.get('/stats', authenticate, authorize('admin', 'manager'), flashOfferController.getStats);

/**
 * @route   GET /api/v1/flash-offers-b2b/:id
 * @desc    Get single flash offer details
 * @access  Private
 */
router.get('/:id', authenticate, flashOfferController.getOne);

/**
 * @route   POST /api/v1/flash-offers-b2b
 * @desc    Create new flash offer
 * @access  Private (Hotel Admin/Manager)
 */
router.post('/', authenticate, authorize('admin', 'manager'), flashOfferController.create);

/**
 * @route   PUT /api/v1/flash-offers-b2b/:id
 * @desc    Update flash offer
 * @access  Private (Hotel Admin/Manager)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), flashOfferController.update);

/**
 * @route   PUT /api/v1/flash-offers-b2b/:id/cancel
 * @desc    Cancel/expire flash offer
 * @access  Private (Hotel Admin/Manager)
 */
router.put('/:id/cancel', authenticate, authorize('admin', 'manager'), flashOfferController.cancel);

/**
 * @route   POST /api/v1/flash-offers-b2b/:id/click
 * @desc    Track click on flash offer
 * @access  Private
 */
router.post('/:id/click', authenticate, flashOfferController.trackClick);

module.exports = router;
