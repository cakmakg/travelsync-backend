"use strict";
/**
 * TravelSync - Background Jobs
 * Option Expiration Job: Releases inventory for expired unconfirmed options
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const reservationService = require('../services/reservation.service');

const initOptionExpirationJob = () => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        logger.info('[Cron Job] Starting Option Expiration Check...');
        try {
            const result = await reservationService.expireOptions();
            logger.info(`[Cron Job] Option Check completed: Checked ${result.checked}, Expired ${result.expired}`);
        } catch (error) {
            logger.error(`[Cron Job] Failed to expire options: ${error.message}`);
        }
    });

    logger.info('Option Expiration Cron Job initialized and scheduled (Every 15 minutes)');
};

module.exports = {
    initOptionExpirationJob
};
