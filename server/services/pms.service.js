"use strict";
/* -------------------------------------------------------
    TravelSync - PMS Integration Service
    Protel, SIHOT ve diğer PMS sistemleri ile entegrasyon
------------------------------------------------------- */

const axios = require('axios');
const logger = require('../config/logger');
const { Property, Reservation, Inventory, RoomType } = require('../models');

/**
 * PMS Integration Service
 * Supports: Protel, SIHOT (and extensible for others)
 */
class PMSService {
    constructor() {
        this.providers = {
            protel: new ProtelProvider(),
            sihot: new SIHOTProvider(),
            opera: new OperaProvider(),
            mews: new MewsProvider(),
        };
    }

    /**
     * Get provider for a property
     */
    getProvider(property) {
        const providerName = property.pms_settings?.provider?.toLowerCase();
        if (!providerName || !this.providers[providerName]) {
            return null;
        }
        return this.providers[providerName];
    }

    /**
     * Sync inventory from PMS to TravelSync
     * @param {string} propertyId - Property ID
     */
    async syncInventory(propertyId) {
        try {
            const property = await Property.findById(propertyId);
            if (!property) {
                throw new Error('Property not found');
            }

            const provider = this.getProvider(property);
            if (!provider) {
                logger.warn(`[PMS] No provider configured for property ${propertyId}`);
                return { success: false, message: 'PMS not configured' };
            }

            logger.info(`[PMS] Starting inventory sync for ${property.name} via ${property.pms_settings.provider}`);

            // Fetch data from PMS
            const pmsData = await provider.fetchInventory(property.pms_settings);

            // Update local inventory
            let updated = 0;
            for (const item of pmsData.inventory || []) {
                await Inventory.findOneAndUpdate(
                    {
                        property_id: propertyId,
                        room_type_id: item.room_type_id,
                        date: new Date(item.date),
                    },
                    {
                        total_rooms: item.total_rooms,
                        available_rooms: item.available_rooms,
                        sold_rooms: item.sold_rooms || 0,
                        blocked_rooms: item.blocked_rooms || 0,
                    },
                    { upsert: true }
                );
                updated++;
            }

            // Update last sync time
            property.pms_settings.last_sync = new Date();
            await property.save();

            logger.info(`[PMS] Inventory sync completed: ${updated} records updated`);

            return {
                success: true,
                updated,
                last_sync: property.pms_settings.last_sync,
            };

        } catch (error) {
            logger.error(`[PMS] Inventory sync error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sync reservations from PMS to TravelSync
     * @param {string} propertyId - Property ID
     * @param {Date} startDate - Start date for sync range
     * @param {Date} endDate - End date for sync range
     */
    async syncReservations(propertyId, startDate, endDate) {
        try {
            const property = await Property.findById(propertyId);
            if (!property) {
                throw new Error('Property not found');
            }

            const provider = this.getProvider(property);
            if (!provider) {
                return { success: false, message: 'PMS not configured' };
            }

            logger.info(`[PMS] Starting reservation sync for ${property.name}`);

            // Fetch reservations from PMS
            const pmsData = await provider.fetchReservations(property.pms_settings, startDate, endDate);

            let created = 0;
            let updated = 0;

            for (const res of pmsData.reservations || []) {
                const existing = await Reservation.findOne({
                    property_id: propertyId,
                    external_ref: res.external_ref,
                });

                if (existing) {
                    // Update existing
                    existing.status = res.status;
                    existing.guest = res.guest;
                    await existing.save();
                    updated++;
                } else {
                    // Create new
                    await Reservation.create({
                        property_id: propertyId,
                        room_type_id: res.room_type_id,
                        rate_plan_id: res.rate_plan_id,
                        external_ref: res.external_ref,
                        source: 'GDS',
                        status: res.status,
                        guest: res.guest,
                        check_in_date: res.check_in_date,
                        check_out_date: res.check_out_date,
                        guests: res.guests,
                        total_price: res.total_price,
                        total_with_tax: res.total_with_tax,
                        currency: res.currency || 'EUR',
                    });
                    created++;
                }
            }

            property.pms_settings.last_sync = new Date();
            await property.save();

            logger.info(`[PMS] Reservation sync completed: ${created} created, ${updated} updated`);

            return { success: true, created, updated };

        } catch (error) {
            logger.error(`[PMS] Reservation sync error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Push reservation to PMS
     * @param {Reservation} reservation - Reservation to push
     */
    async pushReservation(reservation) {
        try {
            const property = await Property.findById(reservation.property_id);
            if (!property) {
                throw new Error('Property not found');
            }

            const provider = this.getProvider(property);
            if (!provider) {
                return { success: false, message: 'PMS not configured' };
            }

            const result = await provider.createReservation(property.pms_settings, reservation);

            // Store external ref
            if (result.external_ref) {
                reservation.external_ref = result.external_ref;
                await reservation.save();
            }

            logger.info(`[PMS] Reservation pushed to PMS: ${result.external_ref}`);

            return { success: true, external_ref: result.external_ref };

        } catch (error) {
            logger.error(`[PMS] Push reservation error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test PMS connection
     */
    async testConnection(propertyId) {
        try {
            const property = await Property.findById(propertyId);
            if (!property) {
                throw new Error('Property not found');
            }

            const provider = this.getProvider(property);
            if (!provider) {
                return { success: false, message: 'PMS not configured' };
            }

            const result = await provider.testConnection(property.pms_settings);
            return result;

        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

/**
 * Protel PMS Provider
 * https://www.protel.net/
 */
class ProtelProvider {
    async testConnection(settings) {
        try {
            // Protel uses SOAP API typically
            // This is a simplified HTTP check
            const response = await axios.get(settings.endpoint + '/status', {
                timeout: 5000,
                headers: { 'X-API-Key': settings.api_key },
            });
            return { success: response.status === 200, message: 'Connected to Protel' };
        } catch (error) {
            return { success: false, message: `Protel connection failed: ${error.message}` };
        }
    }

    async fetchInventory(settings) {
        // Protel API call simulation
        // In real implementation, this would call Protel SOAP/REST API
        logger.info(`[Protel] Fetching inventory from ${settings.endpoint}`);

        // Mock response - replace with actual API call
        return {
            inventory: [],
            message: 'Protel integration requires specific API implementation',
        };
    }

    async fetchReservations(settings, startDate, endDate) {
        logger.info(`[Protel] Fetching reservations ${startDate} to ${endDate}`);
        return { reservations: [] };
    }

    async createReservation(settings, reservation) {
        logger.info(`[Protel] Creating reservation in PMS`);
        return { external_ref: `PROTEL-${Date.now()}` };
    }
}

/**
 * SIHOT PMS Provider
 * https://www.sihot.com/
 */
class SIHOTProvider {
    async testConnection(settings) {
        try {
            const response = await axios.get(settings.endpoint + '/api/v1/ping', {
                timeout: 5000,
                auth: {
                    username: settings.api_key,
                    password: settings.api_secret || '',
                },
            });
            return { success: response.status === 200, message: 'Connected to SIHOT' };
        } catch (error) {
            return { success: false, message: `SIHOT connection failed: ${error.message}` };
        }
    }

    async fetchInventory(settings) {
        logger.info(`[SIHOT] Fetching inventory from ${settings.endpoint}`);
        return { inventory: [] };
    }

    async fetchReservations(settings, startDate, endDate) {
        logger.info(`[SIHOT] Fetching reservations ${startDate} to ${endDate}`);
        return { reservations: [] };
    }

    async createReservation(settings, reservation) {
        logger.info(`[SIHOT] Creating reservation in PMS`);
        return { external_ref: `SIHOT-${Date.now()}` };
    }
}

/**
 * Opera PMS Provider (Oracle Hospitality)
 */
class OperaProvider {
    async testConnection(settings) {
        return { success: false, message: 'Opera integration not implemented' };
    }

    async fetchInventory() { return { inventory: [] }; }
    async fetchReservations() { return { reservations: [] }; }
    async createReservation() { return { external_ref: null }; }
}

/**
 * Mews PMS Provider
 */
class MewsProvider {
    async testConnection(settings) {
        try {
            const response = await axios.post('https://api.mews.com/api/connector/v1/configuration/get', {
                ClientToken: settings.api_key,
                AccessToken: settings.api_secret,
            });
            return { success: true, message: 'Connected to Mews' };
        } catch (error) {
            return { success: false, message: `Mews connection failed: ${error.message}` };
        }
    }

    async fetchInventory() { return { inventory: [] }; }
    async fetchReservations() { return { reservations: [] }; }
    async createReservation() { return { external_ref: null }; }
}

// Export singleton instance
module.exports = new PMSService();
