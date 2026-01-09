"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Contract Controller
------------------------------------------------------- */

const { AgencyContract, Agency, Property } = require('../models');

module.exports = {
  /**
   * Get all agency contracts
   */
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 50, agency_id, property_id, status } = req.query;
      const skip = (page - 1) * limit;

      // Multi-tenant filter: Get contracts for properties belonging to user's organization
      // AgencyContract doesn't have organization_id, we filter by property.organization_id
      const query = {};
      
      // Get all properties for user's organization
      const properties = await Property.find({ organization_id: req.user.organization_id });
      const propertyIds = properties.map(p => p._id);
      query.property_id = { $in: propertyIds };

      if (agency_id) query.agency_id = agency_id;
      if (property_id) {
        // Validate property belongs to user's organization
        const property = await Property.findById(property_id);
        if (!property || property.organization_id.toString() !== req.user.organization_id.toString()) {
          return res.status(400).json({
            success: false,
            error: { message: 'Property not found or does not belong to your organization' },
          });
        }
        query.property_id = property_id;
      }
      if (status) query.status = status;

      const [contracts, total] = await Promise.all([
        AgencyContract.find(query)
          .populate('agency_id', 'code name')
          .populate('property_id', 'name code')
          .populate('rate_plan_id', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        AgencyContract.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: contracts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('[AgencyContract] GetAll error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch contracts' },
      });
    }
  },

  /**
   * Get contract by ID
   */
  getById: async (req, res) => {
    try {
      const contract = await AgencyContract.findById(req.params.id)
        .populate('agency_id', 'code name contact')
        .populate('property_id', 'name code city country organization_id')
        .populate('rate_plan_id', 'name');

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Multi-tenant check: Verify contract's property belongs to user's organization
      if (contract.property_id.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      res.json({ success: true, data: contract });
    } catch (error) {
      console.error('[AgencyContract] GetById error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch contract' },
      });
    }
  },

  /**
   * Create contract
   */
  create: async (req, res) => {
    try {
      const contractData = {
        ...req.body,
        // organization_id removed - property.organization_id is used for multi-tenant
      };

      // Validate agency exists
      const agency = await Agency.findById(contractData.agency_id);
      if (!agency) {
        return res.status(400).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      // Validate property exists and belongs to user's organization
      const property = await Property.findById(contractData.property_id);
      if (!property) {
        return res.status(400).json({
          success: false,
          error: { message: 'Property not found' },
        });
      }
      if (property.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Property does not belong to your organization' },
        });
      }

      // Check for existing active contract
      const existingContract = await AgencyContract.findOne({
        agency_id: contractData.agency_id,
        property_id: contractData.property_id,
        status: 'ACTIVE',
      });

      if (existingContract) {
        return res.status(400).json({
          success: false,
          error: { message: 'Active contract already exists for this agency and property' },
        });
      }

      const contract = await AgencyContract.create(contractData);

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Contract created successfully',
      });
    } catch (error) {
      console.error('[AgencyContract] Create error:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Failed to create contract' },
      });
    }
  },

  /**
   * Update contract
   */
  update: async (req, res) => {
    try {
      // First, verify contract belongs to user's organization
      const contract = await AgencyContract.findById(req.params.id).populate('property_id');
      
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Multi-tenant check: Verify contract's property belongs to user's organization
      if (contract.property_id.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Update contract
      const updatedContract = await AgencyContract.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: updatedContract,
        message: 'Contract updated successfully',
      });
    } catch (error) {
      console.error('[AgencyContract] Update error:', error);
      res.status(400).json({
        success: false,
        error: { message: error.message || 'Failed to update contract' },
      });
    }
  },

  /**
   * Delete contract (soft delete)
   */
  delete: async (req, res) => {
    try {
      // First, verify contract belongs to user's organization
      const contract = await AgencyContract.findById(req.params.id).populate('property_id');
      
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Multi-tenant check: Verify contract's property belongs to user's organization
      if (contract.property_id.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Deactivate contract
      const updatedContract = await AgencyContract.findByIdAndUpdate(
        req.params.id,
        { is_active: false, status: 'SUSPENDED' },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedContract,
        message: 'Contract deactivated successfully',
      });
    } catch (error) {
      console.error('[AgencyContract] Delete error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to delete contract' },
      });
    }
  },

  /**
   * Get active contract between property and agency
   */
  getActiveContract: async (req, res) => {
    try {
      const { propertyId, agencyId } = req.params;

      const contract = await AgencyContract.findActiveContract(agencyId, propertyId);

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'No active contract found' },
        });
      }

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      console.error('[AgencyContract] GetActiveContract error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch active contract' },
      });
    }
  },

  /**
   * Activate contract
   */
  activate: async (req, res) => {
    try {
      // First, verify contract belongs to user's organization
      const contract = await AgencyContract.findById(req.params.id).populate('property_id');

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Multi-tenant check: Verify contract's property belongs to user's organization
      if (contract.property_id.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Validate dates
      const now = new Date();
      if (now < contract.valid_from) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot activate contract before valid_from date' },
        });
      }

      if (now > contract.valid_to) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot activate expired contract' },
        });
      }

      contract.status = 'ACTIVE';
      contract.is_active = true;
      await contract.save();

      res.json({
        success: true,
        data: contract,
        message: 'Contract activated successfully',
      });
    } catch (error) {
      console.error('[AgencyContract] Activate error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to activate contract' },
      });
    }
  },

  /**
   * Suspend contract
   */
  suspend: async (req, res) => {
    try {
      // First, verify contract belongs to user's organization
      const contract = await AgencyContract.findById(req.params.id).populate('property_id');
      
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Multi-tenant check: Verify contract's property belongs to user's organization
      if (contract.property_id.organization_id.toString() !== req.user.organization_id.toString()) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      // Suspend contract
      const updatedContract = await AgencyContract.findByIdAndUpdate(
        req.params.id,
        { status: 'SUSPENDED', is_active: false },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedContract,
        message: 'Contract suspended successfully',
      });
    } catch (error) {
      console.error('[AgencyContract] Suspend error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to suspend contract' },
      });
    }
  },
};