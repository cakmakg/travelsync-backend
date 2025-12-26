const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/dashboard', analyticsController.dashboard);
router.get('/occupancy', analyticsController.occupancy);
router.get('/revenue', analyticsController.revenue);
router.get('/reservations/stats', analyticsController.reservationStats);

module.exports = router;
