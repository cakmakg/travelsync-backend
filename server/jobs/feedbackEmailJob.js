"use strict";
/**
 * TravelSync - Background Jobs
 * Check-Out Feedback Job: Reminds guests to leave a review 24h after check-out
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const Reservation = require('../models').Reservation;
const emailService = require('../services/email.service');

const initFeedbackEmailJob = () => {
    // Run daily at 10:00 AM local server time
    cron.schedule('0 10 * * *', async () => {
        logger.info('[Cron Job] Starting Check-Out Feedback Email Job...');
        try {
            const now = new Date();
            // Guests who checked out between exactly 24 to 48 hours ago
            const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

            const eligibleReservations = await Reservation.find({
                status: 'checked_out',
                feedback_email_sent: false,
                checked_out_at: {
                    $lte: twentyFourHoursAgo,
                    $gte: fortyEightHoursAgo
                },
                'guest.email': { $exists: true, $ne: null }
            }).populate('property_id');

            let sentCount = 0;

            for (const reservation of eligibleReservations) {
                try {
                    if (reservation.property_id && reservation.guest && reservation.guest.email) {
                        // Send the email (async internally, but we await the wrapper anyway)
                        await emailService.sendCheckoutFeedback(reservation, reservation.property_id);

                        // Mark as sent so we don't send again
                        reservation.feedback_email_sent = true;
                        await reservation.save();
                        sentCount++;
                    }
                } catch (err) {
                    logger.error(`[Cron Job] Feedback email error for ${reservation._id}: ${err.message}`);
                }
            }

            logger.info(`[Cron Job] Feedback Email Check completed: Found ${eligibleReservations.length}, Sent ${sentCount}`);
        } catch (error) {
            logger.error(`[Cron Job] Failed to execute feedback emails job: ${error.message}`);
        }
    });

    logger.info('Check-Out Feedback Cron Job initialized and scheduled (Daily at 10:00 AM)');
};

module.exports = {
    initFeedbackEmailJob
};
