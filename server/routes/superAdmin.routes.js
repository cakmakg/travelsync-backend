"use strict";
/* -------------------------------------------------------
    TravelSync - Super Admin Routes
    Platform geneli yönetim endpoint'leri
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');
const { authenticate, isSuperAdmin } = require('../middlewares/auth');

// Seed endpoint - authentication gerektirmez (production'da kaldırılmalı)
router.post('/seed-superadmin', superAdminController.seedSuperAdmin);

// Tüm diğer route'lar authentication ve super admin yetkisi gerektirir
router.use(authenticate);
router.use(isSuperAdmin);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Global dashboard istatistikleri
 * @access  Super Admin
 */
router.get('/dashboard', superAdminController.getDashboard);

/**
 * @route   GET /api/v1/admin/organizations
 * @desc    Tüm organizasyonları listele
 * @access  Super Admin
 * @query   status, search, page, limit
 */
router.get('/organizations', superAdminController.getOrganizations);

/**
 * @route   PUT /api/v1/admin/organizations/:id/status
 * @desc    Organizasyon durumunu güncelle (onay/red/askıya alma)
 * @access  Super Admin
 * @body    { status: 'pending'|'active'|'suspended'|'cancelled', reason?: string }
 */
router.put('/organizations/:id/status', superAdminController.updateOrganizationStatus);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Tüm kullanıcıları listele
 * @access  Super Admin
 * @query   organization_id, role, search, page, limit
 */
router.get('/users', superAdminController.getUsers);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Global audit logları
 * @access  Super Admin
 * @query   organization_id, action, entity_type, page, limit
 */
router.get('/audit-logs', superAdminController.getAuditLogs);

/**
 * @route   GET /api/v1/admin/metrics
 * @desc    Sistem metrikleri (son 7 gün)
 * @access  Super Admin
 */
router.get('/metrics', superAdminController.getMetrics);

module.exports = router;
