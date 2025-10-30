"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Controller (FIXED with Error Handling)
------------------------------------------------------- */

const { Agency } = require('../models');
const reservationService = require('../services/reservation.service');

module.exports = {
  /**
   * Get all agencies
   */
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 50, search, type, is_active } = req.query;
      const skip = (page - 1) * limit;

      const query = { organization_id: req.user.organization_id };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      if (type) query.type = type;
      if (is_active !== undefined) query.is_active = is_active === 'true';

      const [agencies, total] = await Promise.all([
        Agency.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Agency.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: agencies,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('[Agency] GetAll error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch agencies' },
      });
    }
  },

  /**
   * Get agency by ID
   */
  getById: async (req, res) => {
    try {
      const agency = await Agency.findOne({
        _id: req.params.id,
        organization_id: req.user.organization_id,
      });

      if (!agency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      res.json({ success: true, data: agency });
    } catch (error) {
      console.error('[Agency] GetById error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch agency' },
      });
    }
  },

  /**
   * Create agency
   */
  create: async (req, res) => {
    try {
      const agencyData = {
        ...req.body,
        organization_id: req.user.organization_id,
      };

      // Validate commission percentage
      if (agencyData.commission?.default_percentage) {
        const rate = agencyData.commission.default_percentage;
        if (rate < 0 || rate > 50) {
          return res.status(400).json({
            success: false,
            error: { message: 'Commission percentage must be between 0 and 50' },
          });
        }
      }

      // Check for duplicate code
      const existing = await Agency.findOne({
        organization_id: req.user.organization_id,
        code: agencyData.code,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: { message: 'Agency code already exists' },
        });
      }

      const agency = await Agency.create(agencyData);

      res.status(201).json({
        success: true,
        data: agency,
        message: 'Agency created successfully',
      });
    } catch (error) {
      console.error('[Agency] Create error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create agency' },
      });
    }
  },

  /**
   * Update agency
   */
  update: async (req, res) => {
    try {
      const agency = await Agency.findOneAndUpdate(
        {
          _id: req.params.id,
          organization_id: req.user.organization_id,
        },
        req.body,
        { new: true, runValidators: true }
      );

      if (!agency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      res.json({
        success: true,
        data: agency,
        message: 'Agency updated successfully',
      });
    } catch (error) {
      console.error('[Agency] Update error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to update agency' },
      });
    }
  },

  /**
   * Delete agency (soft delete)
   */
  delete: async (req, res) => {
    try {
      const agency = await Agency.findOneAndUpdate(
        {
          _id: req.params.id,
          organization_id: req.user.organization_id,
        },
        { is_active: false },
        { new: true }
      );

      if (!agency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      res.json({
        success: true,
        data: agency,
        message: 'Agency deactivated successfully',
      });
    } catch (error) {
      console.error('[Agency] Delete error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to delete agency' },
      });
    }
  },

  /**
   * Get agency bookings
   */
  getBookings: async (req, res) => {
    try {
      const agency = await Agency.findOne({
        _id: req.params.id,
        organization_id: req.user.organization_id,
      });

      if (!agency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      const result = await reservationService.getAgencyBookings(
        req.params.id,
        req.query
      );

      res.json({
        success: true,
        data: result.bookings,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('[Agency] GetBookings error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch bookings' },
      });
    }
  },

  /**
   * Get commission report
   */
  getCommissionReport: async (req, res) => {
    try {
      const agency = await Agency.findOne({
        _id: req.params.id,
        organization_id: req.user.organization_id,
      });

      if (!agency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      const report = await reservationService.getCommissionReport(
        req.params.id,
        req.query
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('[Agency] GetCommissionReport error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to generate report' },
      });
    }
  },

  /**
   * Mark commission as paid
   */
  markCommissionPaid: async (req, res) => {
    try {
      const { booking_ids } = req.body;

      if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'booking_ids array is required' },
        });
      }

      const agency = await Agency.findOne({
        _id: req.params.id,
        organization_id: req.user.organization_id,
      });

      if (!agency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Agency not found' },
        });
      }

      const result = await reservationService.markCommissionPaid(
        req.params.id,
        booking_ids,
        req.user
      );

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      console.error('[Agency] MarkCommissionPaid error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to mark commission as paid' },
      });
    }
  },
};