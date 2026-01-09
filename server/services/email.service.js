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
