/**
 *  BASE CONTROLLER
 * 
 * DRY (Don't Repeat Yourself) prensibiyle oluşturulmuş base controller.
 * Tüm CRUD işlemlerini tek yerden yönetir.
 * 
 * Her controller bu base'i extend ederek kullanır.
 */

const { AuditLog } = require('../models');

class BaseController {
  /**
   * Constructor
   * @param {mongoose.Model} model - Mongoose model
   * @param {string} modelName - Model adı (audit log için)
   */
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * GET ALL - List all resources with pagination, search, filter
   */
  getAll = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-created_at',
        search = '',
        ...filters
      } = req.query;

      // Build query
      let query = {};

      // Organization filter (multi-tenant) - optional
      if (this.useOrganizationFilter && req.user?.organization_id) {
        query.organization_id = req.user.organization_id;
      }

      // Search (override in child if needed)
      if (search && this.searchFields) {
        query.$or = this.searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        }));
      }

      // Additional filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          query[key] = filters[key];
        }
      });

      // Exclude soft deleted
      query.deleted_at = null;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [items, total] = await Promise.all([
        this.model
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate(this.populateFields || ''),
        this.model.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error(`[${this.modelName}] Get all error:`, error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve resources',
          details: error.message
        }
      });
    }
  };

  /**
   *  GET BY ID - Get single resource
   */
  getById = async (req, res) => {
    try {
      const { id } = req.params;

      let query = {
        _id: id,
        deleted_at: null
      };

      // Organization filter (multi-tenant) - optional
      if (this.useOrganizationFilter && req.user?.organization_id) {
        query.organization_id = req.user.organization_id;
      }

      const item = await this.model
        .findOne(query)
        .populate(this.populateFields || '');

      if (!item) {
        return res.status(404).json({
          success: false,
          error: { message: `${this.modelName} not found` }
        });
      }

      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error(`[${this.modelName}] Get by ID error:`, error);

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid ID format' }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to retrieve resource',
          details: error.message
        }
      });
    }
  };

  /**
   * ➕ CREATE - Create new resource
   */
  create = async (req, res) => {
    try {
      // Add organization_id from authenticated user
      const data = {
        ...req.body,
        organization_id: req.user?.organization_id
      };

      // Custom validation (override in child if needed)
      if (this.validateCreate) {
        const validationError = await this.validateCreate(data);
        if (validationError) {
          return res.status(400).json({
            success: false,
            error: { message: validationError }
          });
        }
      }

      // Create resource
      const item = await this.model.create(data);

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'CREATE',
        entity_type: this.modelName,
        entity_id: item._id,
        changes: {
          before: null,
          after: item.toObject()
        },
        description: `${this.modelName} created`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: item,
        message: `${this.modelName} created successfully`
      });
    } catch (error) {
      console.error(`[${this.modelName}] Create error:`, error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: Object.values(error.errors).map(e => e.message)
          }
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: { message: 'Resource already exists (duplicate key)' }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create resource',
          details: error.message
        }
      });
    }
  };

  /**
   *  UPDATE - Update existing resource
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;

      // Find existing resource
      let query = {
        _id: id,
        deleted_at: null
      };

      // Organization filter (multi-tenant) - optional
      if (this.useOrganizationFilter && req.user?.organization_id) {
        query.organization_id = req.user.organization_id;
      }

      const existing = await this.model.findOne(query);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: `${this.modelName} not found` }
        });
      }

      // Store before state
      const before = existing.toObject();

      // Custom validation (override in child if needed)
      if (this.validateUpdate) {
        const validationError = await this.validateUpdate(req.body, existing);
        if (validationError) {
          return res.status(400).json({
            success: false,
            error: { message: validationError }
          });
        }
      }

      // Update resource
      Object.assign(existing, req.body);
      await existing.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'UPDATE',
        entity_type: this.modelName,
        entity_id: existing._id,
        changes: {
          before,
          after: existing.toObject()
        },
        description: `${this.modelName} updated`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        data: existing,
        message: `${this.modelName} updated successfully`
      });
    } catch (error) {
      console.error(`[${this.modelName}] Update error:`, error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: Object.values(error.errors).map(e => e.message)
          }
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid ID format' }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update resource',
          details: error.message
        }
      });
    }
  };

  /**
   * 🗑️ DELETE - Soft delete resource
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;

      // Find existing resource
      let query = {
        _id: id,
        deleted_at: null
      };

      // Organization filter (multi-tenant) - optional
      if (this.useOrganizationFilter && req.user?.organization_id) {
        query.organization_id = req.user.organization_id;
      }

      const existing = await this.model.findOne(query);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: `${this.modelName} not found` }
        });
      }

      // Store before state
      const before = existing.toObject();

      // Soft delete
      existing.deleted_at = new Date();
      await existing.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'DELETE',
        entity_type: this.modelName,
        entity_id: existing._id,
        changes: {
          before,
          after: null
        },
        description: `${this.modelName} deleted`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        message: `${this.modelName} deleted successfully`
      });
    } catch (error) {
      console.error(`[${this.modelName}] Delete error:`, error);

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid ID format' }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete resource',
          details: error.message
        }
      });
    }
  };

  /**
   * 🔄 RESTORE - Restore soft deleted resource
   */
  restore = async (req, res) => {
    try {
      const { id } = req.params;

      let query = { _id: id };

      // Organization filter (multi-tenant) - optional
      if (this.useOrganizationFilter && req.user?.organization_id) {
        query.organization_id = req.user.organization_id;
      }

      const existing = await this.model.findOne(query);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: `${this.modelName} not found` }
        });
      }

      if (!existing.deleted_at) {
        return res.status(400).json({
          success: false,
          error: { message: `${this.modelName} is not deleted` }
        });
      }

      // Restore
      existing.deleted_at = null;
      await existing.save();

      // Audit log
      await AuditLog.logAction({
        organization_id: req.user?.organization_id,
        user_id: req.user?._id,
        action: 'RESTORE',
        entity_type: this.modelName,
        entity_id: existing._id,
        description: `${this.modelName} restored`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        data: existing,
        message: `${this.modelName} restored successfully`
      });
    } catch (error) {
      console.error(`[${this.modelName}] Restore error:`, error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to restore resource',
          details: error.message
        }
      });
    }
  };
}

module.exports = BaseController;