const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Simple Nodemailer wrapper - we will expand with templates & providers later
const transporter = nodemailer.createTransport(
  process.env.SMTP_URL || {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'user',
      pass: process.env.SMTP_PASS || 'pass',
    },
  }
);

// Load templates cache
const templatesDir = path.join(__dirname, '..', 'templates', 'emails');
const templateCache = {};
function loadTemplate(name) {
  if (templateCache[name]) return templateCache[name];
  const p = path.join(templatesDir, `${name}.html`);
  const content = fs.readFileSync(p, 'utf8');
  templateCache[name] = content;
  return content;
}

function renderTemplate(name, data = {}) {
  let tpl = loadTemplate(name);
  Object.keys(data).forEach((k) => {
    const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    tpl = tpl.replace(regex, data[k] !== undefined ? String(data[k]) : '');
  });
  return tpl;
}

exports.sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({ from: process.env.EMAIL_FROM || 'noreply@example.com', to, subject, html, text });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email', error);
    throw error;
  }
};

// High-level helpers
exports.sendBookingConfirmation = async (reservation, property) => {
  try {
    const to = reservation.guest?.email;
    if (!to) throw new Error('Guest email not available');

    const html = renderTemplate('booking-confirmation', {
      booking_reference: reservation.booking_reference || '',
      guest_name: reservation.guest?.name || '',
      property_name: property?.name || '',
      check_in_date: (reservation.check_in_date || '').toString().split('T')[0],
      check_out_date: (reservation.check_out_date || '').toString().split('T')[0],
      nights: reservation.nights || '',
      guests: `${reservation.guests?.adults || 0} adults, ${reservation.guests?.children || 0} children`,
      currency: reservation.currency || 'EUR',
      total_with_tax: reservation.total_with_tax || '',
    });

    const subject = `Booking Confirmation - ${reservation.booking_reference || ''}`;

    // send asynchronously
    exports.sendMail({ to, subject, html }).catch((err) => logger.error('Booking confirmation send failed', err));
  } catch (error) {
    logger.error('sendBookingConfirmation error', error);
  }
};

exports.sendCancellation = async (reservation, property, reason) => {
  try {
    const to = reservation.guest?.email;
    if (!to) throw new Error('Guest email not available');

    const html = renderTemplate('cancellation', {
      booking_reference: reservation.booking_reference || '',
      guest_name: reservation.guest?.name || '',
      property_name: property?.name || '',
      reason: reason || 'No reason provided',
    });

    const subject = `Reservation Cancelled - ${reservation.booking_reference || ''}`;
    exports.sendMail({ to, subject, html }).catch((err) => logger.error('Cancellation email send failed', err));
  } catch (error) {
    logger.error('sendCancellation error', error);
  }
};

/**
 * Send new reservation alert to hotel
 */
exports.sendNewReservationAlert = async (reservation, property) => {
  try {
    const to = property?.contact?.email;
    if (!to) {
      logger.warn('Hotel email not available for reservation alert');
      return;
    }

    const html = renderTemplate('new-reservation-alert', {
      booking_reference: reservation.booking_reference || '',
      guest_name: reservation.guest?.name || '',
      guest_email: reservation.guest?.email || '',
      guest_phone: reservation.guest?.phone || '',
      special_requests: reservation.guest?.special_requests || 'None',
      property_name: property?.name || '',
      check_in_date: (reservation.check_in_date || '').toString().split('T')[0],
      check_out_date: (reservation.check_out_date || '').toString().split('T')[0],
      nights: reservation.nights || '',
      room_type: reservation.room_type_id?.name || '',
      guests: `${reservation.guests?.adults || 0} adults, ${reservation.guests?.children || 0} children`,
      currency: reservation.currency || 'EUR',
      total_with_tax: reservation.total_with_tax || '',
      source: reservation.source || 'DIRECT',
    });

    const subject = `🆕 New Reservation - ${reservation.booking_reference || ''}`;
    exports.sendMail({ to, subject, html }).catch((err) => logger.error('New reservation alert failed', err));
  } catch (error) {
    logger.error('sendNewReservationAlert error', error);
  }
};

/**
 * Send check-in reminder to guest (24 hours before)
 */
exports.sendCheckInReminder = async (reservation, property) => {
  try {
    const to = reservation.guest?.email;
    if (!to) throw new Error('Guest email not available');

    const html = renderTemplate('check-in-reminder', {
      booking_reference: reservation.booking_reference || '',
      guest_name: reservation.guest?.name || '',
      property_name: property?.name || '',
      check_in_date: (reservation.check_in_date || '').toString().split('T')[0],
      check_out_date: (reservation.check_out_date || '').toString().split('T')[0],
      room_type: reservation.room_type_id?.name || '',
      guests: `${reservation.guests?.adults || 0} adults, ${reservation.guests?.children || 0} children`,
      property_phone: property?.contact?.phone || '',
      property_email: property?.contact?.email || '',
    });

    const subject = `📅 Reminder: Check-in Tomorrow - ${reservation.booking_reference || ''}`;
    exports.sendMail({ to, subject, html }).catch((err) => logger.error('Check-in reminder failed', err));
  } catch (error) {
    logger.error('sendCheckInReminder error', error);
  }
};

/**
 * Send option expiring warning to agency
 */
exports.sendOptionExpiringWarning = async (option, property, agencyEmail) => {
  try {
    if (!agencyEmail) {
      logger.warn('Agency email not available for option warning');
      return;
    }

    const expiresAt = option.option_expires_at ? new Date(option.option_expires_at) : null;
    const hoursRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - new Date()) / (1000 * 60 * 60))) : 0;

    const html = renderTemplate('option-expiring', {
      booking_reference: option.booking_reference || '',
      property_name: property?.name || '',
      check_in_date: (option.check_in_date || '').toString().split('T')[0],
      check_out_date: (option.check_out_date || '').toString().split('T')[0],
      room_type: option.room_type_id?.name || '',
      currency: option.currency || 'EUR',
      total_with_tax: option.total_with_tax || '',
      hours_remaining: hoursRemaining,
      expires_at: expiresAt ? expiresAt.toLocaleString() : '',
    });

    const subject = `⏰ Option Expiring Soon - ${option.booking_reference || ''}`;
    exports.sendMail({ to: agencyEmail, subject, html }).catch((err) => logger.error('Option expiring warning failed', err));
  } catch (error) {
    logger.error('sendOptionExpiringWarning error', error);
  }
};

