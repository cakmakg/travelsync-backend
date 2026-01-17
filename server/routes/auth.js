"use strict";
/* -------------------------------------------------------
    TravelSync - Auth Routes
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { authenticate } = require('../middlewares/auth');
const { passwordValidationMiddleware } = require('../middlewares/security');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 * @security Password validation (min 8 chars, uppercase, lowercase, number, special char)
 */
router.post('/register', passwordValidationMiddleware, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;