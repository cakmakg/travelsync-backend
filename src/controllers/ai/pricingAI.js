"use strict";
/* -------------------------------------------------------
    TravelSync - AI Pricing Controller
    Controller for AI-powered price suggestions
------------------------------------------------------- */

const pricingAIService = require('../../services/pricingAI.service');
const asyncHandler = require('../../middlewares/asyncHandler');
const { Price } = require('../../models');

/**
 * 🎯 AI Pricing Controller
 */
class PricingAIController {
  /**
   * Get AI price suggestions for a date range
   * POST /api/v1/ai/pricing/suggestions
   */
  getSuggestions = asyncHandler(async (req, res) => {
    const {
      property_id,
      room_type_id,
      rate_plan_id,
      start_date,
      end_date,
      options = {},
    } = req.body;

    // Validate required fields
    if (!property_id || !room_type_id || !rate_plan_id || !start_date || !end_date) {
      return res.badRequest('Missing required fields: property_id, room_type_id, rate_plan_id, start_date, end_date');
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.badRequest('Invalid date format');
    }

    if (startDate >= endDate) {
      return res.badRequest('Start date must be before end date');
    }

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return res.badRequest('Date range cannot exceed 90 days');
    }

    // Get AI price suggestions
    const result = await pricingAIService.getPriceSuggestions({
      property_id,
      room_type_id,
      rate_plan_id,
      start_date: startDate,
      end_date: endDate,
      options,
    });

    return res.success(result, 'AI price suggestions generated successfully');
  });

  /**
   * Apply AI price suggestions
   * POST /api/v1/ai/pricing/apply
   */
  applySuggestions = asyncHandler(async (req, res) => {
    const { property_id, room_type_id, rate_plan_id, suggestions } = req.body;

    // Validate required fields
    if (!property_id || !room_type_id || !rate_plan_id || !suggestions || !Array.isArray(suggestions)) {
      return res.badRequest('Missing required fields: property_id, room_type_id, rate_plan_id, suggestions');
    }

    // Apply suggestions
    const applied = [];
    const failed = [];

    for (const suggestion of suggestions) {
      try {
        // Update or create price
        const price = await Price.findOneAndUpdate(
          {
            property_id,
            room_type_id,
            rate_plan_id,
            date: new Date(suggestion.date),
            deleted_at: null,
          },
          {
            $set: {
              amount: suggestion.suggested_price,
              source: 'AI_SUGGESTION',
              updatedAt: new Date(),
            },
            $setOnInsert: {
              property_id,
              room_type_id,
              rate_plan_id,
              date: new Date(suggestion.date),
              currency: 'EUR',
              is_available: true,
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
          }
        );

        applied.push({
          date: suggestion.date,
          price: price.amount,
        });
      } catch (error) {
        console.error('[PricingAI] Error applying suggestion:', error);
        failed.push({
          date: suggestion.date,
          error: error.message,
        });
      }
    }

    return res.success({
      applied: applied.length,
      failed: failed.length,
      applied_suggestions: applied,
      failed_suggestions: failed,
    }, `Applied ${applied.length} price suggestions`);
  });

  /**
   * Get AI pricing analytics
   * GET /api/v1/ai/pricing/analytics
   */
  getAnalytics = asyncHandler(async (req, res) => {
    const { property_id, room_type_id, rate_plan_id, start_date, end_date } = req.query;

    // Validate required fields
    if (!property_id || !room_type_id || !rate_plan_id || !start_date || !end_date) {
      return res.badRequest('Missing required fields: property_id, room_type_id, rate_plan_id, start_date, end_date');
    }

    // Get AI price suggestions
    const result = await pricingAIService.getPriceSuggestions({
      property_id,
      room_type_id,
      rate_plan_id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      options: {
        consider_occupancy: true,
        consider_seasonality: true,
        consider_day_of_week: true,
        consider_historical_demand: true,
      },
    });

    // Calculate analytics
    const analytics = {
      total_suggestions: result.suggestions.length,
      average_confidence: result.summary.average_confidence,
      total_revenue_impact: result.summary.total_revenue_impact,
      average_price_change: result.summary.average_price_change,
      price_distribution: {
        increased: result.suggestions.filter((s) => s.suggested_price > s.current_price).length,
        decreased: result.suggestions.filter((s) => s.suggested_price < s.current_price).length,
        unchanged: result.suggestions.filter((s) => s.suggested_price === s.current_price).length,
      },
      top_factors: this.getTopFactors(result.suggestions),
    };

    return res.success(analytics, 'AI pricing analytics generated successfully');
  });

  /**
   * Get top factors influencing pricing
   * @param {Array} suggestions - Price suggestions
   * @returns {Array} Top factors
   */
  getTopFactors(suggestions) {
    const factorCounts = {};

    for (const suggestion of suggestions) {
      for (const [factor, value] of Object.entries(suggestion.factors)) {
        if (value > 1.1 || value < 0.9) {
          factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        }
      }
    }

    return Object.entries(factorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({
        factor,
        impact_count: count,
        impact_percentage: Math.round((count / suggestions.length) * 100),
      }));
  }
}

module.exports = new PricingAIController();

