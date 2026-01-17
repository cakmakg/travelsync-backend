"use strict";
/* -------------------------------------------------------
    TravelSync - WhatsApp Service
    Twilio/WhatsApp Business API entegrasyonu
    Flash Offer ve bildirimler için
------------------------------------------------------- */

const logger = require('../config/logger');

/**
 * WhatsApp Servisi
 * Acentelere Flash Offer ve bildirim gönderme
 */
class WhatsAppService {
    constructor() {
        this.isConfigured = false;
        this.client = null;

        // Twilio yapılandırma kontrolü
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            try {
                const twilio = require('twilio');
                this.client = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
                this.isConfigured = true;
                logger.info('WhatsApp Service: Twilio yapılandırıldı');
            } catch (error) {
                logger.warn('WhatsApp Service: Twilio yapılandırılamadı', error.message);
            }
        } else {
            logger.warn('WhatsApp Service: Twilio credentials eksik - Mock mod aktif');
        }
    }

    /**
     * WhatsApp mesajı gönder
     * @param {String} to - Alıcı telefon numarası (E.164 format: +491234567890)
     * @param {String} message - Mesaj içeriği
     * @returns {Promise<Object>} Gönderim sonucu
     */
    async sendMessage(to, message) {
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        // Mock mod (Twilio yoksa)
        if (!this.isConfigured) {
            logger.info(`[MOCK] WhatsApp mesajı: ${formattedTo} - ${message.substring(0, 50)}...`);
            return {
                success: true,
                mock: true,
                sid: `MOCK_${Date.now()}`,
                to: formattedTo,
                message: message.substring(0, 100)
            };
        }

        try {
            const result = await this.client.messages.create({
                from: this.fromNumber,
                to: formattedTo,
                body: message
            });

            logger.info(`WhatsApp mesajı gönderildi: ${formattedTo} - SID: ${result.sid}`);

            return {
                success: true,
                sid: result.sid,
                to: formattedTo,
                status: result.status
            };
        } catch (error) {
            logger.error(`WhatsApp mesaj hatası: ${error.message}`, { to: formattedTo });
            throw error;
        }
    }

    /**
     * Flash Offer bildirimi gönder
     * @param {Object} offer - Flash offer detayları
     * @param {Array<Object>} agencies - Alıcı acenteler
     * @returns {Promise<Object>} Gönderim sonuçları
     */
    async sendFlashOffer(offer, agencies) {
        const results = {
            sent: [],
            failed: [],
            skipped: []
        };

        // Mesaj şablonu
        const getMessage = (agency, language = 'de') => {
            const templates = {
                de: `🔥 FLASH ANGEBOT - ${offer.property_name}

⏰ Nur ${offer.hours_valid} Stunden gültig!
🏨 ${offer.room_count} Zimmer verfügbar
💰 ${offer.discount_percentage}% Rabatt

📅 Gültig: ${offer.valid_from} - ${offer.valid_to}

Buchen Sie jetzt über TravelSync!

---
TravelSync | Ihr Hotel-Partner`,

                en: `🔥 FLASH OFFER - ${offer.property_name}

⏰ Valid for ${offer.hours_valid} hours only!
🏨 ${offer.room_count} rooms available
💰 ${offer.discount_percentage}% discount

📅 Valid: ${offer.valid_from} - ${offer.valid_to}

Book now via TravelSync!

---
TravelSync | Your Hotel Partner`,

                tr: `🔥 FLAŞ TEKLİF - ${offer.property_name}

⏰ Sadece ${offer.hours_valid} saat geçerli!
🏨 ${offer.room_count} oda mevcut
💰 %${offer.discount_percentage} indirim

📅 Geçerlilik: ${offer.valid_from} - ${offer.valid_to}

TravelSync üzerinden hemen rezervasyon yapın!

---
TravelSync | Otel Partneriniz`
            };

            return templates[language] || templates.de;
        };

        // Acentelere gönder
        for (const agency of agencies) {
            // WhatsApp etkin mi kontrol et
            if (!agency.whatsapp_settings?.enabled) {
                results.skipped.push({
                    agency_id: agency._id,
                    agency_name: agency.name,
                    reason: 'WhatsApp disabled'
                });
                continue;
            }

            // Flash offer bildirimi açık mı?
            if (!agency.whatsapp_settings?.notification_types?.flash_offers) {
                results.skipped.push({
                    agency_id: agency._id,
                    agency_name: agency.name,
                    reason: 'Flash offer notifications disabled'
                });
                continue;
            }

            // Telefon numarası var mı?
            const phoneNumber = agency.whatsapp_settings?.phone_number;
            if (!phoneNumber) {
                results.skipped.push({
                    agency_id: agency._id,
                    agency_name: agency.name,
                    reason: 'No phone number'
                });
                continue;
            }

            try {
                const language = agency.whatsapp_settings?.preferred_language || 'de';
                const message = getMessage(agency, language);

                const result = await this.sendMessage(phoneNumber, message);

                results.sent.push({
                    agency_id: agency._id,
                    agency_name: agency.name,
                    phone: phoneNumber,
                    sid: result.sid,
                    mock: result.mock || false
                });
            } catch (error) {
                results.failed.push({
                    agency_id: agency._id,
                    agency_name: agency.name,
                    error: error.message
                });
            }
        }

        // Sonuç özeti logla
        logger.info(`Flash Offer gönderildi: ${results.sent.length} başarılı, ${results.failed.length} başarısız, ${results.skipped.length} atlandı`);

        return results;
    }

    /**
     * Rezervasyon bildirimi gönder
     * @param {Object} reservation - Rezervasyon detayları
     * @param {Object} agency - Acente
     * @param {String} type - Bildirim tipi (new, cancelled)
     */
    async sendReservationNotification(reservation, agency, type = 'new') {
        if (!agency.whatsapp_settings?.enabled) {
            return { success: false, reason: 'WhatsApp disabled' };
        }

        const phoneNumber = agency.whatsapp_settings?.phone_number;
        if (!phoneNumber) {
            return { success: false, reason: 'No phone number' };
        }

        // Bildirim tipi kontrolü
        const notificationEnabled = type === 'new'
            ? agency.whatsapp_settings?.notification_types?.new_reservations
            : agency.whatsapp_settings?.notification_types?.cancellations;

        if (!notificationEnabled) {
            return { success: false, reason: `${type} notifications disabled` };
        }

        const language = agency.whatsapp_settings?.preferred_language || 'de';

        const messages = {
            new: {
                de: `✅ Neue Buchung - ${reservation.booking_reference}\n\n🏨 ${reservation.property_name}\n📅 ${reservation.check_in} - ${reservation.check_out}\n👤 ${reservation.guest_name}`,
                en: `✅ New Booking - ${reservation.booking_reference}\n\n🏨 ${reservation.property_name}\n📅 ${reservation.check_in} - ${reservation.check_out}\n👤 ${reservation.guest_name}`,
                tr: `✅ Yeni Rezervasyon - ${reservation.booking_reference}\n\n🏨 ${reservation.property_name}\n📅 ${reservation.check_in} - ${reservation.check_out}\n👤 ${reservation.guest_name}`
            },
            cancelled: {
                de: `❌ Stornierung - ${reservation.booking_reference}\n\n🏨 ${reservation.property_name}\n📅 ${reservation.check_in} - ${reservation.check_out}`,
                en: `❌ Cancellation - ${reservation.booking_reference}\n\n🏨 ${reservation.property_name}\n📅 ${reservation.check_in} - ${reservation.check_out}`,
                tr: `❌ İptal - ${reservation.booking_reference}\n\n🏨 ${reservation.property_name}\n📅 ${reservation.check_in} - ${reservation.check_out}`
            }
        };

        const message = messages[type]?.[language] || messages[type]?.de;

        try {
            const result = await this.sendMessage(phoneNumber, message);
            return { success: true, sid: result.sid };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Test mesajı gönder
     * @param {String} phoneNumber - Test telefon numarası
     * @returns {Promise<Object>}
     */
    async sendTestMessage(phoneNumber) {
        const message = `✅ TravelSync WhatsApp Test\n\nBu bir test mesajıdır. WhatsApp entegrasyonunuz başarıyla çalışıyor!\n\n---\nTravelSync`;

        return this.sendMessage(phoneNumber, message);
    }

    /**
     * Servis durumu kontrol
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            provider: 'twilio',
            fromNumber: this.isConfigured ? this.fromNumber : null
        };
    }
}

module.exports = new WhatsAppService();
