/**
 *  BASE CONTROLLER
 * 
 * DRY (Don't Repeat Yourself) prensibiyle oluşturulmuş base controller.
 * Tüm CRUD işlemlerini tek yerden yönetir.
 * 
 * Her controller bu base'i extend ederek kullanır.
 * 
 * Uses:
 * - Response helper (res.success(), res.error(), etc.)
 * - Error handler middleware (automatic error catching)
 */

const asyncHandler = require('../middlewares/asyncHandler');

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
  getAll = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sort = '-created_at',
      search = '',
      ...filters
    } = req.query;

    // Build query
    const query = {};

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
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const query = {
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
      return res.notFound(`${this.modelName} not found`);
    }

    return res.success(item);
  });

  /**
   * ➕ CREATE - Create new resource
   */
  create = asyncHandler(async (req, res) => {
    // Add organization_id from authenticated user
    const data = {
      ...req.body,
      organization_id: req.user?.organization_id
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
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find existing resource
    const query = {
      _id: id,
      deleted_at: null
    };

    // Organization filter (multi-tenant) - optional
    if (this.useOrganizationFilter && req.user?.organization_id) {
      query.organization_id = req.user.organization_id;
    }

    const existing = await this.model.findOne(query);

    if (!existing) {
      return res.notFound(`${this.modelName} not found`);
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
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find existing resource
    const query = {
      _id: id,
      deleted_at: null
    };

    // Organization filter (multi-tenant) - optional
    if (this.useOrganizationFilter && req.user?.organization_id) {
      query.organization_id = req.user.organization_id;
    }

    const existing = await this.model.findOne(query);

    if (!existing) {
      return res.notFound(`${this.modelName} not found`);
    }

    // Store before state
    const before = existing.toObject();

    // Soft delete
    existing.deleted_at = new Date();
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
   */
  restore = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const query = { _id: id };

    // Organization filter (multi-tenant) - optional
    if (this.useOrganizationFilter && req.user?.organization_id) {
      query.organization_id = req.user.organization_id;
    }

    const existing = await this.model.findOne(query);

    if (!existing) {
      return res.notFound(`${this.modelName} not found`);
    }

    if (!existing.deleted_at) {
      return res.badRequest(`${this.modelName} is not deleted`);
    }

    // Restore
    existing.deleted_at = null;
    await existing.save();

    // Audit log
    await require('../services/audit.service').logAction({
      action: 'RESTORE',
      entity_type: this.modelName,
      entity_id: existing._id,
      description: `${this.modelName} restored`,
    }, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });

    return res.success(existing, { message: `${this.modelName} restored successfully` });
  });
}

module.exports = BaseController;