"use strict";
/* -------------------------------------------------------
    TravelSync - Flash Offer B2B Controller
    Hem Hotel hem Agency için flash offer işlemleri
------------------------------------------------------- */

const asyncHandler = require('../middlewares/asyncHandler');
const { FlashOffer, Property, RoomType, HotelAgencyPartnership } = require('../models');
const { logAction } = require('../services/audit.service');

/**
 * Flash Offer B2B Controller
 */
class FlashOfferB2BController {
    /**
     * Kendi offer'larını veya mevcut offer'ları getir (role göre)
     * GET /api/v1/flash-offers-b2b
     */
    getMyOffers = asyncHandler(async (req, res) => {
        const orgType = req.user.organization_type;
        const orgId = req.user.organization_id;

        if (orgType === 'hotel') {
            // Hotel kendi offer'larını görür
            const offers = await FlashOffer.find({ hotel_org_id: orgId })
                .populate('property_id', 'name address')
                .populate('room_type_id', 'name code')
                .sort({ createdAt: -1 });

            return res.success({ items: offers, total: offers.length });
        } else {
            // Agency, partner otellerinin offer'larını görür
            const offers = await FlashOffer.getOffersForAgency(orgId);
            return res.success({ items: offers, total: offers.length });
        }
    });

    /**
     * Acenteye uygun aktif flash offer'ları listele
     * GET /api/v1/flash-offers-b2b/agency
     */
    getOffersForAgency = asyncHandler(async (req, res) => {
        const agencyOrgId = req.user.organization_id;
        const offers = await FlashOffer.getOffersForAgency(agencyOrgId);

        return res.success({
            items: offers,
            total: offers.length,
        });
    });

    /**
     * Flash Offer istatistikleri
     * GET /api/v1/flash-offers-b2b/stats
     */
    getStats = asyncHandler(async (req, res) => {
        const hotelOrgId = req.user.organization_id;
        const now = new Date();

        const [activeCount, totalCount, expiredCount, soldOutCount] = await Promise.all([
            FlashOffer.countDocuments({ hotel_org_id: hotelOrgId, status: 'active', offer_expires_at: { $gt: now } }),
            FlashOffer.countDocuments({ hotel_org_id: hotelOrgId }),
            FlashOffer.countDocuments({ hotel_org_id: hotelOrgId, status: 'expired' }),
            FlashOffer.countDocuments({ hotel_org_id: hotelOrgId, status: 'sold_out' }),
        ]);

        // En iyi performans gösteren offer
        const topOffer = await FlashOffer.findOne({ hotel_org_id: hotelOrgId })
            .sort({ rooms_booked: -1 })
            .select('title rooms_booked rooms_available discount_value');

        return res.success({
            active: activeCount,
            total: totalCount,
            expired: expiredCount,
            sold_out: soldOutCount,
            top_offer: topOffer,
        });
    });

    /**
     * Tekil flash offer detayı
     * GET /api/v1/flash-offers-b2b/:id
     */
    getOne = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const offer = await FlashOffer.findById(id)
            .populate('property_id', 'name address images')
            .populate('room_type_id', 'name code capacity bed_configuration amenities')
            .populate('hotel_org_id', 'name');

        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        // Erişim kontrolü
        const orgType = req.user.organization_type;
        const orgId = req.user.organization_id;

        if (orgType === 'hotel') {
            if (!offer.hotel_org_id._id.equals(orgId)) {
                return res.forbidden('Bu offer\'a erişim izniniz yok');
            }
        } else {
            // Agency için partnership kontrolü
            const partnership = await HotelAgencyPartnership.findOne({
                hotel_org_id: offer.hotel_org_id._id,
                agency_org_id: orgId,
                status: 'active',
            });
            if (!partnership) {
                return res.forbidden('Bu offer\'a erişim izniniz yok');
            }
            // View count artır
            await offer.incrementView();
        }

        return res.success(offer);
    });

    /**
     * Yeni flash offer oluştur
     * POST /api/v1/flash-offers-b2b
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
        if (!stay_date_from || !stay_date_to) {
            return res.badRequest('Konaklama tarihleri gereklidir');
        }

        // Property kontrolü
        const property = await Property.findOne({
            _id: property_id,
            organization_id: req.user.organization_id,
            is_active: true,
        });

        if (!property) {
            return res.notFound('Property bulunamadı');
        }

        // Room type (opsiyonel)
        let roomType = null;
        if (room_type_id) {
            roomType = await RoomType.findOne({ _id: room_type_id, property_id });
        }

        // Expiration hesapla
        const expiresAt = offer_expires_at
            ? new Date(offer_expires_at)
            : new Date(Date.now() + hours_valid * 60 * 60 * 1000);

        // İndirimli fiyat
        let discountedPrice = null;
        if (original_price) {
            discountedPrice = discount_type === 'percentage'
                ? original_price * (1 - discount_value / 100)
                : Math.max(0, original_price - discount_value);
        }

        const flashOffer = await FlashOffer.create({
            hotel_org_id: req.user.organization_id,
            property_id,
            room_type_id: room_type_id || null,
            title: title || `${property.name} - ${discount_value}${discount_type === 'percentage' ? '%' : '€'} İndirim`,
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

        await logAction({
            action: 'CREATE',
            entity_type: 'flash_offer',
            entity_id: flashOffer._id,
            description: `Flash offer oluşturuldu: ${flashOffer.title}`,
        }, req.user);

        return res.created(flashOffer, 'Flash offer başarıyla oluşturuldu');
    });

    /**
     * Flash offer güncelle
     * PUT /api/v1/flash-offers-b2b/:id
     */
    update = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const offer = await FlashOffer.findOne({
            _id: id,
            hotel_org_id: req.user.organization_id,
        });

        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        if (!['active', 'draft', 'paused'].includes(offer.status)) {
            return res.badRequest('Bu offer güncellenemez');
        }

        const allowedUpdates = [
            'title', 'description', 'discount_value', 'rooms_available',
            'stay_date_from', 'stay_date_to', 'offer_expires_at', 'target_type', 'target_agency_ids', 'tags'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                offer[field] = req.body[field];
            }
        });

        await offer.save();
        return res.success(offer, 'Flash offer güncellendi');
    });

    /**
     * Flash offer iptal et
     * PUT /api/v1/flash-offers-b2b/:id/cancel
     */
    cancel = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const offer = await FlashOffer.findOne({
            _id: id,
            hotel_org_id: req.user.organization_id,
        });

        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        if (offer.status !== 'active') {
            return res.badRequest('Sadece aktif offer\'lar iptal edilebilir');
        }

        offer.status = 'expired';
        await offer.save();

        await logAction({
            action: 'UPDATE',
            entity_type: 'flash_offer',
            entity_id: id,
            description: `Flash offer iptal edildi: ${offer.title}`,
        }, req.user);

        return res.success(offer, 'Flash offer iptal edildi');
    });

    /**
     * Click tracking
     * POST /api/v1/flash-offers-b2b/:id/click
     */
    trackClick = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const offer = await FlashOffer.findById(id);
        if (!offer) {
            return res.notFound('Flash offer bulunamadı');
        }

        await offer.incrementClick();
        return res.success({ clicked: true });
    });
}

module.exports = new FlashOfferB2BController();
