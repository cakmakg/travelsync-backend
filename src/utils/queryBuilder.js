"use strict";
/* -------------------------------------------------------
    TravelSync - Query Builder Helper
    Build MongoDB queries with pagination, filtering, and sorting
------------------------------------------------------- */

/**
 * Build pagination parameters
 * @param {Object} query - Express request query
 * @returns {Object} - { page, limit, skip }
 */
const buildPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build search query
 * @param {String} search - Search term
 * @param {String[]} fields - Fields to search in
 * @returns {Object} - MongoDB query object
 */
const buildSearchQuery = (search, fields = []) => {
  if (!search || !fields.length) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    })),
  };
};

/**
 * Build filter query
 * @param {Object} query - Express request query
 * @param {String[]} allowedFields - Allowed filter fields
 * @returns {Object} - MongoDB query object
 */
const buildFilterQuery = (query, allowedFields = []) => {
  const filter = {};

  allowedFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== null && query[field] !== '') {
      filter[field] = query[field];
    }
  });

  return filter;
};

/**
 * Build sort query
 * @param {String} sort - Sort string (e.g., "-created_at" or "name")
 * @param {String} defaultSort - Default sort (default: "-created_at")
 * @returns {Object} - MongoDB sort object
 */
const buildSortQuery = (sort, defaultSort = '-created_at') => {
  if (!sort) {
    sort = defaultSort;
  }

  const sortObj = {};
  const sortFields = sort.split(',');

  sortFields.forEach((field) => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  return sortObj;
};

/**
 * Build date range query
 * @param {String} startField - Start date field name
 * @param {String} endField - End date field name
 * @param {String} startDate - Start date string
 * @param {String} endDate - End date string
 * @returns {Object} - MongoDB query object
 */
const buildDateRangeQuery = (startField, endField, startDate, endDate) => {
  const query = {};

  if (startDate || endDate) {
    query[startField] = {};
    if (startDate) {
      query[startField].$gte = new Date(startDate);
    }
    if (endDate) {
      query[startField].$lte = new Date(endDate);
    }
  }

  return query;
};

/**
 * Build complete query with pagination, search, filter, and sort
 * @param {Object} reqQuery - Express request query
 * @param {Object} options - Options object
 * @returns {Object} - { query, pagination, sort }
 */
const buildQuery = (reqQuery, options = {}) => {
  const {
    searchFields = [],
    filterFields = [],
    defaultSort = '-created_at',
    dateRangeField = null,
  } = options;

  // Build pagination
  const pagination = buildPagination(reqQuery);

  // Build search query
  const searchQuery = buildSearchQuery(reqQuery.search, searchFields);

  // Build filter query
  const filterQuery = buildFilterQuery(reqQuery, filterFields);

  // Build date range query
  let dateRangeQuery = {};
  if (dateRangeField) {
    dateRangeQuery = buildDateRangeQuery(
      dateRangeField.startField || 'created_at',
      dateRangeField.endField || 'created_at',
      reqQuery.start_date,
      reqQuery.end_date
    );
  }

  // Combine all queries
  const query = {
    ...searchQuery,
    ...filterQuery,
    ...dateRangeQuery,
  };

  // Build sort
  const sort = buildSortQuery(reqQuery.sort, defaultSort);

  return {
    query,
    pagination,
    sort,
  };
};

module.exports = {
  buildPagination,
  buildSearchQuery,
  buildFilterQuery,
  buildSortQuery,
  buildDateRangeQuery,
  buildQuery,
};

