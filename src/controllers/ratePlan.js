/**
 * 💰 RATE PLAN CONTROLLER
 * 
 * Pricing strategy management
 * Features: CRUD, derived rates, meal plans, cancellation policies
 */

const BaseController = require('./base');
const { RatePlan } = require('../models');
const asyncHandler = require('../middlewares/asyncHandler');

class RatePlanController extends BaseController {
  constructor() {
    super(RatePlan, 'rate_plan');
    
    // Search fields for getAll
    this.searchFields = ['name', 'code', 'meal_plan'];
    
    // Populate fields
    this.populateFields = 'property_id base_rate_plan_id';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Check if rate plan code already exists in this property
    if (data.code && data.property_id) {
      const exists = await RatePlan.findOne({
        code: data.code,
        property_id: data.property_id,
        deleted_at: null
      });

      if (exists) {
        return 'Rate plan code already exists in this property';
      }
    }

    // Validate rate type
    const validRateTypes = ['public', 'private', 'corporate', 'package'];
    if (data.rate_type && !validRateTypes.includes(data.rate_type)) {
      return `Invalid rate type. Must be one of: ${validRateTypes.join(', ')}`;
    }

    // Validate meal plan
    const validMealPlans = ['RO', 'BB', 'HB', 'FB', 'AI'];
    if (data.meal_plan && !validMealPlans.includes(data.meal_plan)) {
      return `Invalid meal plan. Must be one of: ${validMealPlans.join(', ')}`;
    }

    // If derived, must have base_rate_plan_id
    if (data.is_derived && !data.base_rate_plan_id) {
      return 'Derived rate plans must have a base rate plan';
    }

    return null;
  };

  /**
   * Custom validation for update
   */
  validateUpdate = async (data, existing) => {
    // Check if updating code and it already exists
    if (data.code && data.code !== existing.code) {
      const exists = await RatePlan.findOne({
        code: data.code,
        property_id: existing.property_id,
        _id: { $ne: existing._id },
        deleted_at: null
      });

      if (exists) {
        return 'Rate plan code already exists in this property';
      }
    }

    // Validate rate type if updating
    const validRateTypes = ['public', 'private', 'corporate', 'package'];
    if (data.rate_type && !validRateTypes.includes(data.rate_type)) {
      return `Invalid rate type. Must be one of: ${validRateTypes.join(', ')}`;
    }

    // Validate meal plan if updating
    const validMealPlans = ['RO', 'BB', 'HB', 'FB', 'AI'];
    if (data.meal_plan && !validMealPlans.includes(data.meal_plan)) {
      return `Invalid meal plan. Must be one of: ${validMealPlans.join(', ')}`;
    }

    return null;
  };

  /**
   * 🏨 GET BY PROPERTY
   * Get all rate plans for a property
   */
  getByProperty = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const ratePlans = await RatePlan.find({
      property_id: propertyId,
      deleted_at: null
    })
      .populate('property_id')
      .populate('base_rate_plan_id')
      .sort('name');

    return res.success(ratePlans);
  });

  /**
   * 📦 GET PUBLIC RATE PLANS
   * Get all public rate plans for a property
   */
  getPublic = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const ratePlans = await RatePlan.find({
      property_id: propertyId,
      is_public: true,
      is_active: true,
      deleted_at: null
    })
      .populate('property_id')
      .sort('name');

    return res.success(ratePlans);
  });

  /**
   * 🔗 GET DERIVED RATE PLANS
   * Get all rate plans derived from a base rate plan
   */
  getDerived = asyncHandler(async (req, res) => {
    const { baseRatePlanId } = req.params;

    const ratePlans = await RatePlan.find({
      base_rate_plan_id: baseRatePlanId,
      is_derived: true,
      deleted_at: null
    })
      .populate('property_id')
      .populate('base_rate_plan_id')
      .sort('name');

    return res.success(ratePlans);
  });

  /**
   * ✅ TOGGLE ACTIVE STATUS
   * Activate or deactivate rate plan
   */
  toggleActive = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ratePlan = await RatePlan.findOne({
      _id: id,
      deleted_at: null
    });

    if (!ratePlan) {
      return res.notFound('Rate plan not found');
    }

    ratePlan.is_active = !ratePlan.is_active;
    await ratePlan.save();

    return res.success(ratePlan, { message: `Rate plan ${ratePlan.is_active ? 'activated' : 'deactivated'} successfully` });
  });

  /**
   * 🌐 TOGGLE PUBLIC STATUS
   * Make rate plan public or private
   */
  togglePublic = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ratePlan = await RatePlan.findOne({
      _id: id,
      deleted_at: null
    });

    if (!ratePlan) {
      return res.notFound('Rate plan not found');
    }

    ratePlan.is_public = !ratePlan.is_public;
    await ratePlan.save();

    return res.success(ratePlan, { message: `Rate plan is now ${ratePlan.is_public ? 'public' : 'private'}` });
  });

  /**
   * 📅 CHECK VALIDITY
   * Check if rate plan is valid for a specific date
   */
  checkValidity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.badRequest('Date is required');
    }

    const ratePlan = await RatePlan.findOne({
      _id: id,
      deleted_at: null
    });

    if (!ratePlan) {
      return res.notFound('Rate plan not found');
    }

    const checkDate = new Date(date);
    const isValid = ratePlan.isValidForDate(checkDate);

    return res.success({
      rate_plan_id: ratePlan._id,
      rate_plan_name: ratePlan.name,
      date: checkDate,
      is_valid: isValid,
      valid_from: ratePlan.valid_from,
      valid_to: ratePlan.valid_to
    });
  });

  /**
   * 📋 UPDATE CANCELLATION POLICY
   * Update rate plan cancellation policy
   */
  updateCancellationPolicy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cancellation_policy } = req.body;

    if (!cancellation_policy) {
      return res.badRequest('Cancellation policy is required');
    }

    // Validate cancellation policy type
    const validTypes = ['flexible', 'moderate', 'strict', 'non_refundable'];
    if (!validTypes.includes(cancellation_policy.type)) {
      return res.badRequest({ message: 'Invalid cancellation policy type', valid_types: validTypes });
    }

    const ratePlan = await RatePlan.findOne({
      _id: id,
      deleted_at: null
    });

    if (!ratePlan) {
      return res.notFound('Rate plan not found');
    }

    ratePlan.cancellation_policy = cancellation_policy;
    await ratePlan.save();

    return res.success(ratePlan, { message: 'Cancellation policy updated successfully' });
  });

  /**
   * 📊 GET STATISTICS
   * Get rate plan statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ratePlan = await RatePlan.findOne({
      _id: id,
      deleted_at: null
    })
      .populate('property_id')
      .populate('base_rate_plan_id');

    if (!ratePlan) {
      return res.notFound('Rate plan not found');
    }

    const stats = {
      rate_plan: {
        id: ratePlan._id,
        name: ratePlan.name,
        code: ratePlan.code,
        rate_type: ratePlan.rate_type
      },
      configuration: {
        meal_plan: ratePlan.meal_plan,
        is_derived: ratePlan.is_derived,
        base_rate_plan: ratePlan.base_rate_plan_id?.name || null,
        markup_percentage: ratePlan.markup_percentage || 0
      },
      status: {
        is_active: ratePlan.is_active,
        is_public: ratePlan.is_public
      },
      validity: {
        valid_from: ratePlan.valid_from,
        valid_to: ratePlan.valid_to,
        is_valid_today: ratePlan.isValidForDate(new Date())
      },
      cancellation_policy: ratePlan.cancellation_policy
    };

    return res.success(stats);
  });
}

// Export controller instance
module.exports = new RatePlanController();