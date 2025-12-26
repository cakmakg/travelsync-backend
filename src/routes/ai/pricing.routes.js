"use strict";
/* -------------------------------------------------------
    TravelSync - AI Pricing Routes
    Routes for AI-powered price suggestions
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const pricingAIController = require('../../controllers/ai/pricingAI');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/ai/pricing/suggestions
 * @desc    Get AI price suggestions for a date range
 * @access  Private
 */
router.post('/suggestions', pricingAIController.getSuggestions);

/**
 * @route   POST /api/v1/ai/pricing/apply
 * @desc    Apply AI price suggestions
 * @access  Private
 */
router.post('/apply', pricingAIController.applySuggestions);

/**
 * @route   GET /api/v1/ai/pricing/analytics
 * @desc    Get AI pricing analytics
 * @access  Private
 */
router.get('/analytics', pricingAIController.getAnalytics);

module.exports = router;

