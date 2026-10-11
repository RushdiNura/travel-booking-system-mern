import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (!env.email.configured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: { user: env.email.user, pass: env.email.password },
    });
  }
  return transporter;
};

/**
 * Sends an email if SMTP is configured; otherwise logs and no-ops so local
 * development doesn't hard-fail when EMAIL_* vars are unset. Never claim a
 * send succeeded if it didn't reach the transport.
 */
const send = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) {
    logger.warn(`[emailService] SMTP not configured — skipping email "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }
  await t.sendMail({ from: env.email.from, to, subject, html, text });
  return { sent: true };
};

const wrapLayout = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#FAF8F3;font-family:Georgia,'Times New Roman',serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:32px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E7E1D4;">
          <tr><td style="background:#0B1E3D;padding:24px 32px;">
            <span style="color:#FAF8F3;font-size:22px;letter-spacing:0.06em;">AERLUME</span>
            <div style="height:2px;width:48px;background:#F4A340;margin-top:10px;"></div>
          </td></tr>
          <tr><td style="padding:32px;color:#1C2B4A;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">
            <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;color:#0B1E3D;">${title}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 32px;background:#FAF8F3;color:#5B6B8C;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
            Aerlume Travel · This is a transactional email regarding your account or booking.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const sendWelcomeEmail = async (user) => {
  const html = wrapLayout(
    'Welcome to Aerlume',
    `<p>Hi ${user.name},</p><p>Your account is ready. Start exploring destinations, flights, hotels, and curated trips.</p>`
  );
  return send({ to: user.email, subject: 'Welcome to Aerlume', html });
};

export const sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
  const html = wrapLayout(
    'Reset your password',
    `<p>Hi ${user.name},</p><p>We received a request to reset your password. This link expires in 30 minutes.</p>
     <p><a href="${resetUrl}" style="color:#0B1E3D;font-weight:bold;">Reset your password</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
  return send({ to: user.email, subject: 'Reset your Aerlume password', html });
};

export const sendBookingConfirmationEmail = async (user, booking) => {
  const html = wrapLayout(
    'Booking confirmed',
    `<p>Hi ${user.name},</p>
     <p>Your booking <strong>${booking.bookingReference}</strong> is confirmed.</p>
     <p>Total paid: <strong>${booking.pricing.currency} ${booking.pricing.total.toFixed(2)}</strong></p>
     <p><a href="${env.clientUrl}/dashboard/bookings/${booking._id}" style="color:#0B1E3D;font-weight:bold;">View your booking</a></p>`
  );
  return send({ to: user.email, subject: `Booking confirmed — ${booking.bookingReference}`, html });
};

export const sendPaymentFailedEmail = async (user, booking) => {
  const html = wrapLayout(
    'Payment did not go through',
    `<p>Hi ${user.name},</p>
     <p>We couldn't process payment for booking <strong>${booking.bookingReference}</strong>. Your reserved inventory will be held for a short time — please try again from your dashboard.</p>`
  );
  return send({ to: user.email, subject: `Payment issue — ${booking.bookingReference}`, html });
};

export const sendCancellationEmail = async (user, booking) => {
  const html = wrapLayout(
    'Booking cancelled',
    `<p>Hi ${user.name},</p>
     <p>Booking <strong>${booking.bookingReference}</strong> has been cancelled.</p>
     ${
       booking.cancellation?.refundAmount
         ? `<p>Refund amount: <strong>${booking.pricing.currency} ${booking.cancellation.refundAmount.toFixed(2)}</strong> — status: ${booking.cancellation.status}</p>`
         : ''
     }`
  );
  return send({ to: user.email, subject: `Booking cancelled — ${booking.bookingReference}`, html });
};

export const sendRefundEmail = async (user, booking) => {
  const html = wrapLayout(
    'Refund issued',
    `<p>Hi ${user.name},</p>
     <p>A refund of <strong>${booking.pricing.currency} ${booking.cancellation.refundAmount?.toFixed(2)}</strong> has been issued for booking <strong>${booking.bookingReference}</strong>. It may take 5–10 business days to appear on your statement.</p>`
  );
  return send({ to: user.email, subject: `Refund issued — ${booking.bookingReference}`, html });
};

export const sendTripReminderEmail = async (user, booking) => {
  const html = wrapLayout(
    'Your trip is coming up',
    `<p>Hi ${user.name},</p><p>A reminder that your booking <strong>${booking.bookingReference}</strong> is coming up soon. Safe travels!</p>`
  );
  return send({ to: user.email, subject: `Upcoming trip — ${booking.bookingReference}`, html });
};
