const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

router.get('/dashboard', analyticsController.dashboard);
router.get('/occupancy', analyticsController.occupancy);
router.get('/revenue', analyticsController.revenue);
router.get('/reservations/stats', analyticsController.reservationStats);

module.exports = router;
