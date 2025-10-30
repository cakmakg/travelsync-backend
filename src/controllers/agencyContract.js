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

      const query = { organization_id: req.user.organization_id };

      if (agency_id) query.agency_id = agency_id;
      if (property_id) query.property_id = property_id;
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
      const contract = await AgencyContract.findOne({
        _id: req.params.id,
        organization_id: req.user.organization_id,
      })
        .populate('agency_id', 'code name contact')
        .populate('property_id', 'name code city country')
        .populate('rate_plan_id', 'name');

      if (!contract) {
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
        organization_id: req.user.organization_id,
      };

      // Validate agency exists
      const agency = await Agency.findById(contractData.agency_id);
      if (!agency) {
        return res.status(400).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      // Validate property exists
      const property = await Property.findById(contractData.property_id);
      if (!property) {
        return res.status(400).json({
          success: false,
          error: { message: 'Property not found' },
        });
      }

      // Check for existing active contract
      const existingContract = await AgencyContract.findOne({
        organization_id: req.user.organization_id,
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
      const contract = await AgencyContract.findOneAndUpdate(
        {
          _id: req.params.id,
          organization_id: req.user.organization_id,
        },
        req.body,
        { new: true, runValidators: true }
      );

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      res.json({
        success: true,
        data: contract,
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
      const contract = await AgencyContract.findOneAndUpdate(
        {
          _id: req.params.id,
          organization_id: req.user.organization_id,
        },
        { is_active: false, status: 'SUSPENDED' },
        { new: true }
      );

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      res.json({
        success: true,
        data: contract,
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
      const contract = await AgencyContract.findOne({
        _id: req.params.id,
        organization_id: req.user.organization_id,
      });

      if (!contract) {
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
      const contract = await AgencyContract.findOneAndUpdate(
        {
          _id: req.params.id,
          organization_id: req.user.organization_id,
        },
        { status: 'SUSPENDED', is_active: false },
        { new: true }
      );

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: { message: 'Contract not found' },
        });
      }

      res.json({
        success: true,
        data: contract,
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