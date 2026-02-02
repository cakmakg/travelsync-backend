"use strict";
/* -------------------------------------------------------
    TravelSync - Payment Routes
    Reservation payment endpoints
------------------------------------------------------- */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const { authenticate, authorize } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const { Reservation } = require('../models');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/payments/create-intent
 * @desc    Create payment intent for a reservation
 * @access  Private
 * @body    { reservation_id, payment_method: 'stripe' | 'klarna' }
 */
router.post('/create-intent', asyncHandler(async (req, res) => {
    const { reservation_id, payment_method = 'stripe' } = req.body;

    const reservation = await Reservation.findById(reservation_id)
        .populate('property_id', 'name');

    if (!reservation) {
        return res.badRequest('Reservation not found');
    }

    const result = await paymentService.holdPaymentForReservation(reservation, payment_method);

    if (result.success) {
        // Store payment intent ID on reservation
        reservation.payment = reservation.payment || {};
        reservation.payment.stripe_intent_id = result.payment_intent_id;
        reservation.payment.status = 'pending';
        await reservation.save();
    }

    return res.success(result);
}));

/**
 * @route   POST /api/v1/payments/capture/:reservationId
 * @desc    Capture held payment (on check-in)
 * @access  Private (Admin)
 */
router.post('/capture/:reservationId', authorize('admin'), asyncHandler(async (req, res) => {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        return res.notFound('Reservation not found');
    }

    if (!reservation.payment?.stripe_intent_id) {
        return res.badRequest('No payment intent found for this reservation');
    }

    const result = await paymentService.capturePayment(reservation.payment.stripe_intent_id);

    if (result.success) {
        reservation.payment.status = 'paid';
        reservation.payment.paid_amount = result.amount_captured;
        await reservation.save();
    }

    return res.success(result);
}));

/**
 * @route   POST /api/v1/payments/cancel/:reservationId
 * @desc    Cancel held payment (on cancellation)
 * @access  Private (Admin)
 */
router.post('/cancel/:reservationId', authorize('admin'), asyncHandler(async (req, res) => {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        return res.notFound('Reservation not found');
    }

    if (!reservation.payment?.stripe_intent_id) {
        return res.badRequest('No payment intent found for this reservation');
    }

    const result = await paymentService.cancelPayment(reservation.payment.stripe_intent_id);

    if (result.success) {
        reservation.payment.status = 'cancelled';
        await reservation.save();
    }

    return res.success(result);
}));

/**
 * @route   POST /api/v1/payments/refund/:reservationId
 * @desc    Refund a captured payment
 * @access  Private (Admin)
 * @body    { amount?: number }
 */
router.post('/refund/:reservationId', authorize('admin'), asyncHandler(async (req, res) => {
    const { reservationId } = req.params;
    const { amount } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        return res.notFound('Reservation not found');
    }

    if (!reservation.payment?.stripe_intent_id) {
        return res.badRequest('No payment intent found for this reservation');
    }

    const result = await paymentService.refundPayment(reservation.payment.stripe_intent_id, amount);

    if (result.success) {
        reservation.payment.status = 'refunded';
        await reservation.save();
    }

    return res.success(result);
}));

module.exports = router;
