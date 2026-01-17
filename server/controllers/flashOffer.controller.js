"use strict";
/* -------------------------------------------------------
    TravelSync - Flash Offer Controller
    Anlık indirim tekliflerini yönetir
------------------------------------------------------- */

const asyncHandler = require('../middlewares/asyncHandler');
const { Agency, Property, RoomType, Price } = require('../models');
const whatsappService = require('../services/whatsapp.service');
const { logAction } = require('../services/audit.service');

/**
 * Flash Offer Controller
 * Otelcinin son dakika indirimlerini acentelere duyurması için
 */
class FlashOfferController {
    /**
     * Flash Offer Oluştur ve Gönder
     * POST /api/v1/flash-offers
     */
    create = asyncHandler(async (req, res) => {
        const {
            property_id,
            room_type_id,
            room_count,
            discount_percentage,
            valid_from,
            valid_to,
            hours_valid = 24,
            target_agencies = 'all', // 'all' veya agency ID array
            message_note, // Opsiyonel ek mesaj
        } = req.body;

        // Validasyonlar
        if (!property_id) {
            return res.badRequest('Property ID gereklidir');
        }
        if (!room_count || room_count < 1) {
            return res.badRequest('Oda sayısı en az 1 olmalıdır');
        }
        if (!discount_percentage || discount_percentage < 1 || discount_percentage > 90) {
            return res.badRequest('İndirim oranı 1-90 arasında olmalıdır');
        }
        if (!valid_from || !valid_to) {
            return res.badRequest('Geçerlilik tarihleri gereklidir');
        }

        // Property bilgilerini al
        const property = await Property.findOne({
            _id: property_id,
            organization_id: req.user.organization_id,
            is_active: true
        });

        if (!property) {
            return res.notFound('Property bulunamadı');
        }

        // Room type bilgilerini al (varsa)
        let roomType = null;
        if (room_type_id) {
            roomType = await RoomType.findOne({
                _id: room_type_id,
                property_id: property_id
            });
        }

        // Hedef acenteleri belirle
        let agencies;
        if (target_agencies === 'all') {
            // Tüm aktif acenteler
            agencies = await Agency.find({
                organization_id: req.user.organization_id,
                is_active: true,
                'whatsapp_settings.enabled': true
            });
        } else if (Array.isArray(target_agencies)) {
            // Belirli acenteler
            agencies = await Agency.find({
                _id: { $in: target_agencies },
                organization_id: req.user.organization_id,
                is_active: true
            });
        } else {
            return res.badRequest('target_agencies "all" veya acente ID dizisi olmalıdır');
        }

        if (agencies.length === 0) {
            return res.badRequest('WhatsApp bildirimi açık acente bulunamadı');
        }

        // Flash Offer objesi oluştur
        const flashOffer = {
            property_id,
            property_name: property.name,
            property_city: property.address?.city,
            room_type_id: room_type_id || null,
            room_type_name: roomType?.name || 'Çeşitli Odalar',
            room_count,
            discount_percentage,
            valid_from: new Date(valid_from).toLocaleDateString('de-DE'),
            valid_to: new Date(valid_to).toLocaleDateString('de-DE'),
            hours_valid,
            message_note,
            created_by: req.user._id,
            created_at: new Date()
        };

        // WhatsApp mesajlarını gönder
        const results = await whatsappService.sendFlashOffer(flashOffer, agencies);

        // Audit log
        await logAction({
            action: 'CREATE',
            entity_type: 'flash_offer',
            entity_id: null, // Flash offer kalıcı değil
            description: `Flash offer oluşturuldu: ${property.name} - %${discount_percentage} indirim`,
            changes: {
                offer: flashOffer,
                results: {
                    sent: results.sent.length,
                    failed: results.failed.length,
                    skipped: results.skipped.length
                }
            }
        }, req.user);

        return res.created({
            offer: flashOffer,
            notification_results: {
                total_agencies: agencies.length,
                sent: results.sent.length,
                failed: results.failed.length,
                skipped: results.skipped.length,
                details: results
            }
        }, 'Flash Offer başarıyla oluşturuldu ve gönderildi');
    });

    /**
     * WhatsApp durumunu kontrol et
     * GET /api/v1/flash-offers/whatsapp-status
     */
    getWhatsAppStatus = asyncHandler(async (req, res) => {
        const status = whatsappService.getStatus();

        // WhatsApp etkin acente sayısı
        const enabledAgenciesCount = await Agency.countDocuments({
            organization_id: req.user.organization_id,
            'whatsapp_settings.enabled': true
        });

        return res.success({
            ...status,
            enabled_agencies: enabledAgenciesCount
        });
    });

    /**
     * Test mesajı gönder
     * POST /api/v1/flash-offers/test
     */
    sendTestMessage = asyncHandler(async (req, res) => {
        const { phone_number } = req.body;

        if (!phone_number) {
            return res.badRequest('Telefon numarası gereklidir');
        }

        // E.164 format kontrolü
        if (!/^\+[1-9]\d{1,14}$/.test(phone_number)) {
            return res.badRequest('Geçerli bir telefon numarası girin (+491234567890 formatında)');
        }

        try {
            const result = await whatsappService.sendTestMessage(phone_number);

            return res.success({
                ...result,
                message: 'Test mesajı başarıyla gönderildi'
            });
        } catch (error) {
            return res.error(`Mesaj gönderilemedi: ${error.message}`, 500);
        }
    });

    /**
     * Aktif acenteleri listele (WhatsApp bildirim durumu ile)
     * GET /api/v1/flash-offers/agencies
     */
    getAgencies = asyncHandler(async (req, res) => {
        const agencies = await Agency.find({
            organization_id: req.user.organization_id,
            is_active: true
        }).select('name code whatsapp_settings.enabled whatsapp_settings.phone_number');

        const formatted = agencies.map(a => ({
            _id: a._id,
            name: a.name,
            code: a.code,
            whatsapp_enabled: a.whatsapp_settings?.enabled || false,
            has_phone: !!a.whatsapp_settings?.phone_number
        }));

        return res.success({
            items: formatted,
            total: formatted.length,
            whatsapp_enabled_count: formatted.filter(a => a.whatsapp_enabled && a.has_phone).length
        });
    });

    /**
     * Fiyat önerisi al (AI tabanlı)
     * GET /api/v1/flash-offers/price-suggestion
     */
    getPriceSuggestion = asyncHandler(async (req, res) => {
        const { property_id, room_type_id, date } = req.query;

        if (!property_id) {
            return res.badRequest('Property ID gereklidir');
        }

        // Mevcut fiyatı çek
        const priceQuery = {
            property_id,
            date: date ? new Date(date) : new Date()
        };

        if (room_type_id) {
            priceQuery.room_type_id = room_type_id;
        }

        const currentPrice = await Price.findOne(priceQuery);

        // Basit öneri algoritması
        const suggestion = {
            current_price: currentPrice?.amount || null,
            suggested_discount: 20, // Varsayılan %20
            reason: 'Son dakika boş odalar için standart indirim önerisi',
            confidence: 0.7
        };

        // Doluluk oranına göre öneri (basit mantık)
        // Gerçek uygulamada pricingAI.service.js kullanılabilir
        const today = new Date();
        const daysUntilDate = date ? Math.ceil((new Date(date) - today) / (1000 * 60 * 60 * 24)) : 0;

        if (daysUntilDate <= 1) {
            suggestion.suggested_discount = 40;
            suggestion.reason = 'Bugün veya yarın için yüksek indirim önerilir';
            suggestion.confidence = 0.85;
        } else if (daysUntilDate <= 3) {
            suggestion.suggested_discount = 30;
            suggestion.reason = '3 gün içinde için orta-yüksek indirim önerilir';
            suggestion.confidence = 0.8;
        } else if (daysUntilDate <= 7) {
            suggestion.suggested_discount = 20;
            suggestion.reason = '1 hafta içinde için standart indirim önerilir';
            suggestion.confidence = 0.75;
        }

        return res.success(suggestion);
    });
}

module.exports = new FlashOfferController();
