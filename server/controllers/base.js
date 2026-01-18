/**
 *  BASE CONTROLLER
 * 
 * DRY (Don't Repeat Yourself) prensibiyle oluşturulmuş base controller.
 * Tüm CRUD işlemlerini tek yerden yönetir.
 * 
 * MULTI-TENANT SECURITY:
 * - Organization filter ALWAYS applied (no opt-out)
 * - User can only access their organization's data
 * - All operations tied to req.user.organization_id
 * 
 * Uses:
 * - Response helper (res.success(), res.error(), etc.)
 * - Error handler middleware (automatic error catching)
 */

const asyncHandler = require('../middlewares/asyncHandler');
const logger = require('../config/logger');

class BaseController {
  /**
   * Constructor
   * @param {mongoose.Model} model - Mongoose model
   * @param {string} modelName - Model adı (audit log için)
   * @param {boolean} requiresOrgFilter - Organization filter required (default: true)
   */
  constructor(model, modelName, requiresOrgFilter = true) {
    this.model = model;
    this.modelName = modelName;
    // Organization filter is REQUIRED by default (cannot be disabled)
    this.requiresOrgFilter = requiresOrgFilter;
    // Legacy support for useOrganizationFilter flag - always enabled
    this.useOrganizationFilter = true;
  }

  /**
   * Validate user has organization context
   * @private
   */
  _validateOrganizationContext(req) {
    if (!req.user?.organization_id) {
      const error = new Error('Organization context missing');
      error.statusCode = 403;
      logger.error('[BaseController] Missing organization context:', {
        userId: req.user?._id,
        userRole: req.user?.role,
      });
      throw error;
    }
  }

  /**
   * GET ALL - List all resources with pagination, search, filter
   * ALWAYS filters by organization_id
   */
  getAll = asyncHandler(async (req, res) => {
    // Validate organization context (required)
    this._validateOrganizationContext(req);

    const {
      page = 1,
      limit = 10,
      sort = '-created_at',
      search = '',
      ...filters
    } = req.query;

    // Build query
    const query = {};

    // MANDATORY Organization filter - cannot be bypassed
    query.organization_id = req.user.organization_id;

    // Search (override in child if needed)
    if (search && this.searchFields) {
      query.$or = this.searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    // Additional filters - but organization_id is immutable
    Object.keys(filters).forEach(key => {
      // Never allow organization_id override
      if (key !== 'organization_id' && filters[key]) {
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

    return res.success(
      { items },
      {
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      }
    );
  });

  /**
   *  GET BY ID - Get single resource
   * ALWAYS validates organization ownership
   */
  getById = asyncHandler(async (req, res) => {
    // Validate organization context (required)
    this._validateOrganizationContext(req);

    const { id } = req.params;

    const query = {
      _id: id,
      deleted_at: null,
      // MANDATORY organization filter
      organization_id: req.user.organization_id
    };

    const item = await this.model
      .findOne(query)
      .populate(this.populateFields || '');

    if (!item) {
      return res.notFound(`${this.modelName} not found`);
    }

    return res.success(item);
  });

  /**
   * ➕ CREATE - Create new resource
   * ALWAYS ties resource to user's organization
   */
  create = asyncHandler(async (req, res) => {
    // Validate organization context (required)
    this._validateOrganizationContext(req);

    // Validate user is not trying to create for another organization
    if (req.body.organization_id && 
        req.body.organization_id !== req.user.organization_id.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot create resources for other organizations' },
      });
    }

    // MANDATORY: Set organization_id from authenticated user
    const data = {
      ...req.body,
      organization_id: req.user.organization_id
    };

    // Custom validation (override in child if needed)
    if (this.validateCreate) {
      const validationError = await this.validateCreate(data);
      if (validationError) {
        return res.validationError(validationError);
      }
    }

    // Create resource
    const item = await this.model.create(data);

    // Audit log
    await require('../services/audit.service').logAction({
      action: 'CREATE',
      entity_type: this.modelName,
      entity_id: item._id,
      changes: { before: null, after: item.toObject() },
      description: `${this.modelName} created`,
    }, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.created(item, `${this.modelName} created successfully`);
  });

  /**
   *  UPDATE - Update existing resource
   * ALWAYS validates organization ownership before update
   */
  update = asyncHandler(async (req, res) => {
    // Validate organization context (required)
    this._validateOrganizationContext(req);

    const { id } = req.params;

    // Find existing resource - MANDATORY organization filter
    const query = {
      _id: id,
      deleted_at: null,
      organization_id: req.user.organization_id
    };

    const existing = await this.model.findOne(query);

    if (!existing) {
      return res.notFound(`${this.modelName} not found`);
    }

    // Prevent organization_id change
    if (req.body.organization_id) {
      delete req.body.organization_id;
    }

    // Store before state
    const before = existing.toObject();

    // Custom validation (override in child if needed)
    if (this.validateUpdate) {
      const validationError = await this.validateUpdate(req.body, existing);
      if (validationError) {
        return res.validationError(validationError);
      }
    }

    // Update resource
    Object.assign(existing, req.body);
    await existing.save();

    // Audit log
    await require('../services/audit.service').logAction({
      action: 'UPDATE',
      entity_type: this.modelName,
      entity_id: existing._id,
      changes: { before, after: existing.toObject() },
      description: `${this.modelName} updated`,
    }, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(existing, { message: `${this.modelName} updated successfully` });
  });

  /**
   * 🗑️ DELETE - Soft delete resource
   * ALWAYS validates organization ownership before delete
   */
  delete = asyncHandler(async (req, res) => {
    // Validate organization context (required)
    this._validateOrganizationContext(req);

    const { id } = req.params;

    // Find existing resource - MANDATORY organization filter
    const query = {
      _id: id,
      deleted_at: null,
      organization_id: req.user.organization_id
    };

    const existing = await this.model.findOne(query);

    if (!existing) {
      return res.notFound(`${this.modelName} not found`);
    }

    // Store before state
    const before = existing.toObject();

    // Soft delete
    existing.deleted_at = new Date();
    existing.deleted_by = req.user._id;
    await existing.save();

    // Audit log
    await require('../services/audit.service').logAction({
      action: 'DELETE',
      entity_type: this.modelName,
      entity_id: existing._id,
      changes: { before, after: null },
      description: `${this.modelName} deleted`,
    }, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(null, { message: `${this.modelName} deleted successfully` });
  });

  /**
   * 🔄 RESTORE - Restore soft deleted resource
   * ALWAYS validates organization ownership before restore
   */
  restore = asyncHandler(async (req, res) => {
    // Validate organization context (required)
    this._validateOrganizationContext(req);

    const { id } = req.params;

    // MANDATORY organization filter
    const query = { 
      _id: id,
      organization_id: req.user.organization_id
    };

    const existing = await this.model.findOne(query);

    if (!existing) {
      return res.notFound(`${this.modelName} not found`);
    }

    if (!existing.deleted_at) {
      return res.badRequest(`${this.modelName} is not deleted`);
    }

    // Restore
    const before = existing.toObject();
    existing.deleted_at = null;
    existing.restored_by = req.user._id;
    existing.restored_at = new Date();
    await existing.save();

    // Audit log
    await require('../services/audit.service').logAction({
      action: 'RESTORE',
      entity_type: this.modelName,
      entity_id: existing._id,
      changes: { before, after: existing.toObject() },
      description: `${this.modelName} restored`,
    }, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(existing, { message: `${this.modelName} restored successfully` });
  });
}

module.exports = BaseController;