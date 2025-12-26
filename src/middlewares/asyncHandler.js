"use strict";
/* -------------------------------------------------------
    TravelSync - Async Handler Middleware
    Wraps async route handlers to automatically catch errors
------------------------------------------------------- */

/**
 * Wraps async route handler to automatically catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped function that catches errors
 * 
 * @example
 * // Before:
 * router.get('/', async (req, res) => {
 *   try {
 *     const data = await getData();
 *     res.json(data);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * // After:
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await getData();
 *   res.json(data);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

