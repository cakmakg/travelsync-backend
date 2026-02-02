"use strict";
/* -------------------------------------------------------
    TravelSync - Flash Offer Controller
    Anlık indirim tekliflerini yönetir
------------------------------------------------------- */

const asyncHandler = require('../middlewares/asyncHandler');
const { FlashOffer, Property, RoomType, Price, HotelAgencyPartnership } = require('../models');
const whatsappService = require('../services/whatsapp.service');
const { logAction } = require('../services/audit.service');

/**
 * Flash Offer Controller
 * Otelcinin son dakika indirimlerini acentelere duyurması için
 */
class FlashOfferController {
    /**
     * Flash Offer Oluştur ve Kaydet
     * POST /api/v1/flash-offers
     */
    create = asyncHandler(async (req, res) => {
        const {
            property_id,
            room_type_id,
            title,
            description,
            discount_type = 'percentage',
            discount_value,
            rooms_available,
            original_price,
            stay_date_from,
            stay_date_to,
            offer_expires_at,
            hours_valid = 24,
            target_type = 'all_partners',
            target_agency_ids = [],
            send_whatsapp = false,
            tags = [],
        } = req.body;

        // Validasyonlar
        if (!property_id) {
            return res.badRequest('Property ID gereklidir');
        }
        if (!rooms_available || rooms_available < 1) {
            return res.badRequest('Oda sayısı en az 1 olmalıdır');
        }
        if (!discount_value || discount_value < 1) {
            return res.badRequest('İndirim değeri gereklidir');
        }
        if (discount_type === 'percentage' && discount_value > 90) {
            return res.badRequest('İndirim oranı maksimum %90 olabilir');
        }
        if (!stay_date_from || !stay_date_to) {
            return res.badRequest('Konaklama tarihleri gereklidir');
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

        // Offer sona erme zamanını hesapla
        const expiresAt = offer_expires_at
            ? new Date(offer_expires_at)
            : new Date(Date.now() + hours_valid * 60 * 60 * 1000);

        // İndirimli fiyatı hesapla
        let discountedPrice = null;
        if (original_price) {
            if (discount_type === 'percentage') {
                discountedPrice = original_price * (1 - discount_value / 100);
            } else {
                discountedPrice = Math.max(0, original_price - discount_value);
            }
        }

        // Flash Offer oluştur
        const flashOffer = await FlashOffer.create({
            hotel_org_id: req.user.organization_id,
            property_id,
            room_type_id: room_type_id || null,
            title: title || `${property.name} - ${discount_value}% İndirim`,
            description,
            discount_type,
            discount_value,
            original_price: original_price || null,
            discounted_price: discountedPrice,
            rooms_available,
            rooms_booked: 0,
            valid_from: new Date(),
            valid_to: expiresAt,
            offer_expires_at: expiresAt,
            stay_date_from: new Date(stay_date_from),
            stay_date_to: new Date(stay_date_to),
            target_type,
            target_agency_ids: target_type === 'specific_agencies' ? target_agency_ids : [],
            status: 'active',
            created_by_user_id: req.user._id,
            currency: property.settings?.currency || 'EUR',
            tags,
        });

        // WhatsApp gönderimi (opsiyonel)
        let whatsappResults = null;
        if (send_whatsapp) {
            // Partner acenteleri al
            const partnerships = await HotelAgencyPartnership.find({
                hotel_org_id: req.user.organization_id,
                status: 'active',
            }).populate('agency_org_id', 'name');

            if (partnerships.length > 0) {
                const offerDetails = {
                    property_name: property.name,
                    property_city: property.address?.city,
                    room_type_name: roomType?.name || 'Çeşitli Odalar',
                    room_count: rooms_available,
                    discount_percentage: discount_type === 'percentage' ? discount_value : null,
                    valid_from: new Date(stay_date_from).toLocaleDateString('de-DE'),
                    valid_to: new Date(stay_date_to).toLocaleDateString('de-DE'),
                    hours_valid,
                };
                whatsappResults = await whatsappService.sendFlashOffer(offerDetails, partnerships);
            }
        }

        // Audit log
        await logAction({
            action: 'CREATE',
            entity_type: 'flash_offer',
            entity_id: flashOffer._id,
            description: `Flash offer oluşturuldu: ${property.name} - ${discount_type === 'percentage' ? '%' : '€'}${discount_value} indirim`,
            changes: { offer_id: flashOffer._id },
        }, req.user);

        return res.created({
            offer: flashOffer,
            whatsapp_sent: send_whatsapp && whatsappResults ? whatsappResults.sent?.length || 0 : 0,
        }, 'Flash Offer başarıyla oluşturuldu');
    });

    /**
     * Otel flash offer'larını listele
     * GET /api/v1/flash-offers
     */
    list = asyncHandler(async (req, res) => {
        const { status, page = 1, limit = 20 } = req.query;

        const query = { hotel_org_id: req.user.organization_id };
        if (status) {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [offers, total] = await Promise.all([
            FlashOffer.find(query)
                .populate('property_id', 'name address')
                .populate('room_type_id', 'name code')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            FlashOffer.countDocuments(query),
        ]);

        return res.success({
            items: offers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    });

    /**
     * Flash Offer güncelle
     * PUT /api/v1/flash-offers/:id
     */
    update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;

        const offer = await FlashOffer.findOne({
            _id: id,
            hotel_org_id: req.user.organization_id,
        });

        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        // Sadece aktif offer'lar güncellenebilir
        if (offer.status !== 'active' && offer.status !== 'draft') {
            return res.badRequest('Bu offer güncellenemez');
        }

        Object.assign(offer, updates);
        await offer.save();

        return res.success(offer, 'Flash offer güncellendi');
    });

    /**
     * Flash Offer duraklat/devam ettir
     * PUT /api/v1/flash-offers/:id/toggle-status
     */
    toggleStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const offer = await FlashOffer.findOne({
            _id: id,
            hotel_org_id: req.user.organization_id,
        });

        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        if (offer.status === 'active') {
            offer.status = 'paused';
        } else if (offer.status === 'paused') {
            offer.status = 'active';
        } else {
            return res.badRequest('Bu offer\'ın durumu değiştirilemez');
        }

        await offer.save();
        return res.success(offer, `Flash offer ${offer.status === 'active' ? 'aktifleştirildi' : 'duraklatıldı'}`);
    });

    /**
     * Flash Offer sil
     * DELETE /api/v1/flash-offers/:id
     */
    delete = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const offer = await FlashOffer.findOneAndDelete({
            _id: id,
            hotel_org_id: req.user.organization_id,
        });

        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        await logAction({
            action: 'DELETE',
            entity_type: 'flash_offer',
            entity_id: id,
            description: `Flash offer silindi: ${offer.title}`,
        }, req.user);

        return res.success(null, 'Flash offer silindi');
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
