"use strict";
/* -------------------------------------------------------
    TravelSync - Flash Offer Routes
    Anlık indirim teklifi API endpoint'leri
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const flashOfferController = require('../controllers/flashOffer.controller');
const { authenticate } = require('../middlewares/auth');

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/v1/flash-offers
 * @desc    Flash Offer oluştur ve acentelere gönder
 * @access  Private
 * @body    {
 *   property_id: required,
 *   room_type_id: optional,
 *   room_count: required (min 1),
 *   discount_percentage: required (1-90),
 *   valid_from: required (Date),
 *   valid_to: required (Date),
 *   hours_valid: optional (default 24),
 *   target_agencies: 'all' | [agency_ids],
 *   message_note: optional
 * }
 */
router.post('/', flashOfferController.create);

/**
 * @route   GET /api/v1/flash-offers/whatsapp-status
 * @desc    WhatsApp servis durumunu kontrol et
 * @access  Private
 */
router.get('/whatsapp-status', flashOfferController.getWhatsAppStatus);

/**
 * @route   POST /api/v1/flash-offers/test
 * @desc    Test WhatsApp mesajı gönder
 * @access  Private
 * @body    { phone_number: '+491234567890' }
 */
router.post('/test', flashOfferController.sendTestMessage);

/**
 * @route   GET /api/v1/flash-offers/agencies
 * @desc    WhatsApp bildirim durumu ile acenteleri listele
 * @access  Private
 */
router.get('/agencies', flashOfferController.getAgencies);

/**
 * @route   GET /api/v1/flash-offers/price-suggestion
 * @desc    Fiyat/indirim önerisi al
 * @access  Private
 * @query   property_id (required), room_type_id (optional), date (optional)
 */
router.get('/price-suggestion', flashOfferController.getPriceSuggestion);

module.exports = router;
