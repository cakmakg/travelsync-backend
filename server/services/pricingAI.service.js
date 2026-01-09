"use strict";
/* -------------------------------------------------------
    TravelSync - AI Pricing Service
    Dynamic pricing AI service for price recommendations
------------------------------------------------------- */

const { Price, Reservation, Inventory } = require('../models');

/**
 * 🎯 AI Pricing Service
 * Provides AI-powered price suggestions based on various factors
 */
class PricingAIService {
  /**
   * Get AI price suggestions for a date range
   * @param {Object} params - Pricing parameters
   * @param {string} params.property_id - Property ID
   * @param {string} params.room_type_id - Room type ID
   * @param {string} params.rate_plan_id - Rate plan ID
   * @param {Date} params.start_date - Start date
   * @param {Date} params.end_date - End date
   * @param {Object} params.options - AI options
   * @returns {Promise<Object>} Price suggestions
   */
  async getPriceSuggestions(params) {
    const {
      property_id,
      room_type_id,
      rate_plan_id,
      start_date,
      end_date,
      options = {},
    } = params;

    // Generate date array
    const dates = this.generateDateArray(start_date, end_date);
    const suggestions = [];

    for (const date of dates) {
      // Get current price
      const currentPrice = await Price.findOne({
        property_id,
        room_type_id,
        rate_plan_id,
        date: date,
        deleted_at: null,
      });

      if (!currentPrice) {
        // Skip if no current price
        continue;
      }

      // Calculate AI factors
      const factors = await this.calculateFactors({
        property_id,
        room_type_id,
        date,
        options,
      });

      // Calculate suggested price
      const suggestedPrice = this.calculateSuggestedPrice(
        currentPrice.amount,
        factors
      );

      // Calculate confidence score
      const confidence = this.calculateConfidence(factors);

      suggestions.push({
        date: date,
        current_price: currentPrice.amount,
        suggested_price: suggestedPrice,
        confidence: confidence,
        factors: factors,
        reason: this.generateReason(factors),
      });
    }

    // Calculate summary
    const summary = this.calculateSummary(suggestions);

    return {
      suggestions,
      summary,
    };
  }

  /**
   * Calculate AI factors for pricing
   * @param {Object} params - Factor calculation parameters
   * @returns {Promise<Object>} AI factors
   */
  async calculateFactors(params) {
    const { property_id, room_type_id, date, options } = params;
    const factors = {
      occupancy: 1.0,
      seasonality: 1.0,
      day_of_week: 1.0,
      events: 1.0,
      weather: 1.0,
      historical_demand: 1.0,
    };

    // 1. Occupancy factor (if enabled)
    if (options.consider_occupancy !== false) {
      factors.occupancy = await this.calculateOccupancyFactor(
        property_id,
        room_type_id,
        date
      );
    }

    // 2. Seasonality factor (if enabled)
    if (options.consider_seasonality !== false) {
      factors.seasonality = this.calculateSeasonalityFactor(date);
    }

    // 3. Day of week factor (if enabled)
    if (options.consider_day_of_week !== false) {
      factors.day_of_week = this.calculateDayOfWeekFactor(date);
    }

    // 4. Historical demand factor (if enabled)
    if (options.consider_historical_demand !== false) {
      factors.historical_demand = await this.calculateHistoricalDemandFactor(
        property_id,
        room_type_id,
        date
      );
    }

    // 5. Events factor (if enabled and API available)
    if (options.consider_events === true) {
      factors.events = await this.calculateEventsFactor(property_id, date);
    }

    // 6. Weather factor (if enabled and API available)
    if (options.consider_weather === true) {
      factors.weather = await this.calculateWeatherFactor(property_id, date);
    }

    return factors;
  }

  /**
   * Calculate occupancy factor
   * High occupancy = higher price (supply/demand)
   * @param {string} property_id - Property ID
   * @param {string} room_type_id - Room type ID
   * @param {Date} date - Date
   * @returns {Promise<number>} Occupancy factor (0.8 - 1.2)
   */
  async calculateOccupancyFactor(property_id, room_type_id, date) {
    try {
      // Get inventory for the date
      const inventory = await Inventory.findOne({
        property_id,
        room_type_id,
        date: date,
      });

      if (!inventory) {
        return 1.0; // Default factor
      }

      // Calculate occupancy rate
      const totalRooms = inventory.allotment || 1;
      const bookedRooms = totalRooms - (inventory.available || 0);
      const occupancyRate = bookedRooms / totalRooms;

      // Convert occupancy to price factor
      // High occupancy (0.8-1.0) = 1.1-1.2 factor (increase price)
      // Low occupancy (0.0-0.3) = 0.8-0.9 factor (decrease price)
      if (occupancyRate >= 0.8) {
        return 1.15 + (occupancyRate - 0.8) * 0.25; // 1.15 - 1.20
      } else if (occupancyRate >= 0.5) {
        return 1.0 + (occupancyRate - 0.5) * 0.5; // 1.0 - 1.15
      } else if (occupancyRate >= 0.3) {
        return 0.9 + (occupancyRate - 0.3) * 0.5; // 0.9 - 1.0
      } else {
        return 0.8 + occupancyRate * 0.33; // 0.8 - 0.9
      }
    } catch (error) {
      console.error('[PricingAI] Error calculating occupancy factor:', error);
      return 1.0; // Default factor
    }
  }

  /**
   * Calculate seasonality factor
   * Peak season = higher price
   * @param {Date} date - Date
   * @returns {number} Seasonality factor (0.8 - 1.3)
   */
  calculateSeasonalityFactor(date) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Peak season: Summer (June-August) and December
    if (month >= 6 && month <= 8) {
      // Summer: 1.15 - 1.25
      return 1.2;
    } else if (month === 12) {
      // December holidays: 1.2 - 1.3
      if (day >= 20 && day <= 31) {
        return 1.25;
      }
      return 1.15;
    } else if (month >= 4 && month <= 5) {
      // Spring: 1.05 - 1.1
      return 1.08;
    } else if (month >= 9 && month <= 10) {
      // Early autumn: 1.0 - 1.05
      return 1.03;
    } else {
      // Low season: 0.8 - 0.95
      return 0.9;
    }
  }

  /**
   * Calculate day of week factor
   * Weekend = higher price
   * @param {Date} date - Date
   * @returns {number} Day of week factor (0.9 - 1.15)
   */
  calculateDayOfWeekFactor(date) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend (Friday, Saturday, Sunday) = higher price
    if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
      return 1.1; // Weekend: 10% increase
    } else if (dayOfWeek === 4) {
      // Thursday: slight increase
      return 1.05;
    } else {
      // Weekday: normal price
      return 1.0;
    }
  }

  /**
   * Calculate historical demand factor
   * Based on past reservations for the same date
   * @param {string} property_id - Property ID
   * @param {string} room_type_id - Room type ID
   * @param {Date} date - Date
   * @returns {Promise<number>} Historical demand factor (0.8 - 1.2)
   */
  async calculateHistoricalDemandFactor(property_id, room_type_id, date) {
    try {
      // Get same date in previous years (last 3 years)
      const currentYear = date.getFullYear();
      const years = [currentYear - 1, currentYear - 2, currentYear - 3];

      let totalReservations = 0;
      let totalDays = 0;

      for (const year of years) {
        const historicalDate = new Date(date);
        historicalDate.setFullYear(year);

        // Get reservations for the same date (check-in or check-out)
        const reservations = await Reservation.countDocuments({
          property_id,
          room_type_id,
          $or: [
            { check_in_date: historicalDate },
            { check_out_date: historicalDate },
          ],
          status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
        });

        totalReservations += reservations;
        totalDays += 1;
      }

      // Calculate average reservations per day
      const avgReservations = totalReservations / totalDays;

      // Convert to factor
      // High demand (3+ reservations) = 1.1 - 1.2
      // Medium demand (1-2 reservations) = 1.0 - 1.1
      // Low demand (0-1 reservations) = 0.8 - 1.0
      if (avgReservations >= 3) {
        return 1.15;
      } else if (avgReservations >= 2) {
        return 1.1;
      } else if (avgReservations >= 1) {
        return 1.05;
      } else {
        return 0.95;
      }
    } catch (error) {
      console.error('[PricingAI] Error calculating historical demand factor:', error);
      return 1.0; // Default factor
    }
  }

  /**
   * Calculate events factor
   * Local events = higher demand = higher price
   * @param {string} property_id - Property ID
   * @param {Date} date - Date
   * @returns {Promise<number>} Events factor (1.0 - 1.3)
   */
  async calculateEventsFactor(_property_id, _date) {
    // TODO: Integrate with events API (e.g., Eventbrite, local events API)
    void _property_id; void _date;
    // For now, return default factor
    return 1.0;
  }

  /**
   * Calculate weather factor
   * Good weather = higher demand = higher price
   * @param {string} property_id - Property ID
   * @param {Date} date - Date
   * @returns {Promise<number>} Weather factor (0.9 - 1.1)
   */
  async calculateWeatherFactor(_property_id, _date) {
    // TODO: Integrate with weather API (e.g., OpenWeatherMap)
    void _property_id; void _date;
    // For now, return default factor
    return 1.0;
  }


  /**
   * Calculate suggested price based on factors
   * @param {number} currentPrice - Current price
   * @param {Object} factors - AI factors
   * @returns {number} Suggested price
   */
  calculateSuggestedPrice(currentPrice, factors) {
    // Calculate weighted average of factors
    const weights = {
      occupancy: 0.3,
      seasonality: 0.25,
      day_of_week: 0.15,
      historical_demand: 0.2,
      events: 0.05,
      weather: 0.05,
    };

    let totalFactor = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (factors[key] !== undefined) {
        totalFactor += factors[key] * weight;
        totalWeight += weight;
      }
    }

    // Normalize factor
    const normalizedFactor = totalWeight > 0 ? totalFactor / totalWeight : 1.0;

    // Calculate suggested price
    const suggestedPrice = currentPrice * normalizedFactor;

    // Round to 2 decimal places
    return Math.round(suggestedPrice * 100) / 100;
  }

  /**
   * Calculate confidence score
   * @param {Object} factors - AI factors
   * @returns {number} Confidence score (0.0 - 1.0)
   */
  calculateConfidence(factors) {
    // Confidence based on number of factors available
    const factorCount = Object.values(factors).filter((f) => f !== undefined).length;
    const maxFactors = 6;

    // Base confidence
    let confidence = factorCount / maxFactors;

    // Adjust based on factor values (more extreme factors = lower confidence)
    const factorValues = Object.values(factors).filter((f) => f !== undefined);
    const avgDeviation = factorValues.reduce((sum, f) => sum + Math.abs(f - 1.0), 0) / factorValues.length;

    // High deviation = lower confidence
    if (avgDeviation > 0.2) {
      confidence *= 0.9;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reason for price suggestion
   * @param {Object} factors - AI factors
   * @returns {string} Reason text
   */
  generateReason(factors) {
    const reasons = [];

    if (factors.occupancy > 1.1) {
      reasons.push('High occupancy expected');
    } else if (factors.occupancy < 0.9) {
      reasons.push('Low occupancy expected');
    }

    if (factors.seasonality > 1.15) {
      reasons.push('Peak season');
    } else if (factors.seasonality < 0.9) {
      reasons.push('Low season');
    }

    if (factors.day_of_week > 1.05) {
      reasons.push('Weekend pricing');
    }

    if (factors.historical_demand > 1.1) {
      reasons.push('High historical demand');
    }

    if (factors.events > 1.1) {
      reasons.push('Local events expected');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Standard pricing';
  }

  /**
   * Calculate summary statistics
   * @param {Array} suggestions - Price suggestions
   * @returns {Object} Summary statistics
   */
  calculateSummary(suggestions) {
    if (suggestions.length === 0) {
      return {
        total_revenue_impact: 0,
        average_price_change: 0,
        average_confidence: 0,
      };
    }

    let totalRevenueImpact = 0;
    let totalPriceChange = 0;
    let totalConfidence = 0;

    for (const suggestion of suggestions) {
      const priceChange = suggestion.suggested_price - suggestion.current_price;
      totalRevenueImpact += priceChange;
      totalPriceChange += priceChange / suggestion.current_price;
      totalConfidence += suggestion.confidence;
    }

    return {
      total_revenue_impact: Math.round(totalRevenueImpact * 100) / 100,
      average_price_change: Math.round((totalPriceChange / suggestions.length) * 100) / 100,
      average_confidence: Math.round((totalConfidence / suggestions.length) * 100) / 100,
      suggestion_count: suggestions.length,
    };
  }

  /**
   * Generate date array
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array<Date>} Date array
   */
  generateDateArray(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const currentDate = new Date(start);
    while (currentDate < end) {
      dates.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dates;
  }
}

module.exports = new PricingAIService();

