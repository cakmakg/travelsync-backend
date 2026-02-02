"use strict";
/* -------------------------------------------------------
    TravelSync - Payment Service
    Stripe ve Klarna entegrasyonu
------------------------------------------------------- */

const logger = require('../config/logger');

/**
 * Payment Service
 * Supports: Stripe (credit card), Klarna (BNPL), SEPA Direct Debit
 */
class PaymentService {
    constructor() {
        this.stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
        this.klarnaEnabled = !!process.env.KLARNA_API_KEY;

        if (this.stripeEnabled) {
            this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            logger.info('[Payment] Stripe initialized');
        }
    }

    // ============================================
    // STRIPE METHODS
    // ============================================

    /**
     * Create a payment intent (hold funds)
     * @param {Object} params - Payment parameters
     * @returns {Object} Payment intent
     */
    async createPaymentIntent({ amount, currency = 'eur', description, metadata }) {
        if (!this.stripeEnabled) {
            logger.warn('[Payment] Stripe not configured');
            return { success: false, message: 'Stripe not configured' };
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                description,
                metadata,
                capture_method: 'manual', // Hold funds, don't capture yet
            });

            logger.info(`[Payment] PaymentIntent created: ${paymentIntent.id}`);

            return {
                success: true,
                payment_intent_id: paymentIntent.id,
                client_secret: paymentIntent.client_secret,
                status: paymentIntent.status,
            };

        } catch (error) {
            logger.error(`[Payment] Create intent error: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Capture a held payment (on check-in)
     * @param {string} paymentIntentId - Payment Intent ID
     */
    async capturePayment(paymentIntentId) {
        if (!this.stripeEnabled) {
            return { success: false, message: 'Stripe not configured' };
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId);

            logger.info(`[Payment] Payment captured: ${paymentIntentId}`);

            return {
                success: true,
                payment_intent_id: paymentIntent.id,
                status: paymentIntent.status,
                amount_captured: paymentIntent.amount_received / 100,
            };

        } catch (error) {
            logger.error(`[Payment] Capture error: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cancel (release) a held payment
     * @param {string} paymentIntentId - Payment Intent ID
     */
    async cancelPayment(paymentIntentId) {
        if (!this.stripeEnabled) {
            return { success: false, message: 'Stripe not configured' };
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

            logger.info(`[Payment] Payment cancelled: ${paymentIntentId}`);

            return {
                success: true,
                payment_intent_id: paymentIntent.id,
                status: 'cancelled',
            };

        } catch (error) {
            logger.error(`[Payment] Cancel error: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Refund a captured payment
     * @param {string} paymentIntentId - Payment Intent ID
     * @param {number} amount - Amount to refund (optional, full refund if not specified)
     */
    async refundPayment(paymentIntentId, amount = null) {
        if (!this.stripeEnabled) {
            return { success: false, message: 'Stripe not configured' };
        }

        try {
            const refundParams = {
                payment_intent: paymentIntentId,
            };

            if (amount) {
                refundParams.amount = Math.round(amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundParams);

            logger.info(`[Payment] Refund created: ${refund.id}`);

            return {
                success: true,
                refund_id: refund.id,
                amount_refunded: refund.amount / 100,
                status: refund.status,
            };

        } catch (error) {
            logger.error(`[Payment] Refund error: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Create a customer in Stripe
     * @param {Object} params - Customer details
     */
    async createCustomer({ email, name, phone, metadata }) {
        if (!this.stripeEnabled) {
            return { success: false, message: 'Stripe not configured' };
        }

        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                phone,
                metadata,
            });

            logger.info(`[Payment] Customer created: ${customer.id}`);

            return {
                success: true,
                customer_id: customer.id,
            };

        } catch (error) {
            logger.error(`[Payment] Create customer error: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // KLARNA METHODS (BNPL - Buy Now Pay Later)
    // ============================================

    /**
     * Create Klarna session
     * @param {Object} params - Order parameters
     */
    async createKlarnaSession({ amount, currency = 'EUR', order_lines, billing_address }) {
        if (!process.env.KLARNA_API_KEY) {
            return { success: false, message: 'Klarna not configured' };
        }

        try {
            const axios = require('axios');

            const auth = Buffer.from(`${process.env.KLARNA_API_KEY}:${process.env.KLARNA_API_SECRET}`).toString('base64');

            const response = await axios.post(
                `${process.env.KLARNA_API_URL || 'https://api.playground.klarna.com'}/payments/v1/sessions`,
                {
                    purchase_country: billing_address?.country || 'DE',
                    purchase_currency: currency,
                    locale: 'de-DE',
                    order_amount: Math.round(amount * 100),
                    order_lines: order_lines || [{
                        type: 'physical',
                        name: 'Hotel Reservation',
                        quantity: 1,
                        unit_price: Math.round(amount * 100),
                        total_amount: Math.round(amount * 100),
                    }],
                    billing_address,
                },
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            logger.info(`[Klarna] Session created: ${response.data.session_id}`);

            return {
                success: true,
                session_id: response.data.session_id,
                client_token: response.data.client_token,
                payment_method_categories: response.data.payment_method_categories,
            };

        } catch (error) {
            logger.error(`[Klarna] Create session error: ${error.response?.data?.error_messages || error.message}`);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // ESCROW / HOLD METHODS
    // ============================================

    /**
     * Hold payment for a reservation (escrow-like)
     * Funds are held until check-in, then captured
     */
    async holdPaymentForReservation(reservation, paymentMethod = 'stripe') {
        const amount = reservation.total_with_tax || reservation.total_price;
        const currency = reservation.currency || 'EUR';

        const description = `Reservation ${reservation.booking_reference} - Hold`;
        const metadata = {
            reservation_id: reservation._id?.toString(),
            booking_reference: reservation.booking_reference,
            property_id: reservation.property_id?.toString(),
            guest_email: reservation.guest?.email,
        };

        if (paymentMethod === 'stripe') {
            return await this.createPaymentIntent({ amount, currency, description, metadata });
        } else if (paymentMethod === 'klarna') {
            return await this.createKlarnaSession({
                amount,
                currency,
                billing_address: {
                    email: reservation.guest?.email,
                    country: reservation.guest?.country || 'DE',
                },
            });
        }

        return { success: false, message: 'Unknown payment method' };
    }

    /**
     * Release held payment on check-in
     */
    async releasePaymentOnCheckIn(paymentIntentId) {
        return await this.capturePayment(paymentIntentId);
    }

    /**
     * Cancel held payment on cancellation
     */
    async cancelHeldPayment(paymentIntentId) {
        return await this.cancelPayment(paymentIntentId);
    }
}

module.exports = new PaymentService();
