/**
 * 🏢 ORGANIZATION CONTROLLER
 * 
 * Multi-tenant container management
 * Features: CRUD, statistics, subscription management
 */

const BaseController = require('./base');
const { Organization } = require('../models');

class OrganizationController extends BaseController {
  constructor() {
    super(Organization, 'organization');
    
    // Disable organization filtering (organizations don't belong to organizations)
    this.useOrganizationFilter = false;
    
    // Search fields for getAll
    this.searchFields = ['name', 'code', 'country'];
    
    // Populate fields
    this.populateFields = '';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Check if organization code already exists
    if (data.code) {
      const exists = await Organization.findOne({ 
        code: data.code,
        deleted_at: null 
      });
      
      if (exists) {
        return 'Organization code already exists';
      }
    }

    return null;
  };

  /**
   * Custom validation for update
   */
  validateUpdate = async (data, existing) => {
    // Check if updating code and it already exists
    if (data.code && data.code !== existing.code) {
      const exists = await Organization.findOne({ 
        code: data.code,
        _id: { $ne: existing._id },
        deleted_at: null 
      });
      
      if (exists) {
        return 'Organization code already exists';
      }
    }

    return null;
  };

  /**
   * 📊 GET STATISTICS
   * Get organization statistics
   */
  getStats = async (req, res) => {
    try {
      const { id } = req.params;

      const org = await Organization.findOne({
        _id: id,
        deleted_at: null
      });

      if (!org) {
        return res.status(404).json({
          success: false,
          error: { message: 'Organization not found' }
        });
      }

      // Calculate stats (you can expand this)
      const stats = {
        organization: {
          id: org._id,
          name: org.name,
          type: org.type,
          status: org.status
        },
        subscription: {
          plan: org.subscription?.plan || 'free',
          status: org.subscription?.status || 'inactive',
          is_active: org.hasActiveSubscription(),
          expires_at: org.subscription?.expires_at
        },
        created_at: org.created_at
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[Organization] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get statistics',
          details: error.message
        }
      });
    }
  };

  /**
   * ✅ UPDATE SUBSCRIPTION
   * Update organization subscription
   */
  updateSubscription = async (req, res) => {
    try {
      const { id } = req.params;
      const { plan, expires_at } = req.body;

      if (!plan) {
        return res.status(400).json({
          success: false,
          error: { message: 'Plan is required' }
        });
      }

      const org = await Organization.findOne({
        _id: id,
        deleted_at: null
      });

      if (!org) {
        return res.status(404).json({
          success: false,
          error: { message: 'Organization not found' }
        });
      }

      // Update subscription
      org.subscription = {
        plan,
        status: 'active',
        starts_at: new Date(),
        expires_at: expires_at ? new Date(expires_at) : null
      };

      await org.save();

      res.status(200).json({
        success: true,
        data: org,
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      console.error('[Organization] Update subscription error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update subscription',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔍 GET ACTIVE ORGANIZATIONS
   * Get all active organizations
   */
  getActive = async (req, res) => {
    try {
      const orgs = await Organization.findActive();

      res.status(200).json({
        success: true,
        data: orgs
      });
    } catch (error) {
      console.error('[Organization] Get active error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get active organizations',
          details: error.message
        }
      });
    }
  };
}

// Export controller instance
module.exports = new OrganizationController();