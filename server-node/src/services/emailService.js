const axios = require('axios');
const config = require('../config/env');

/**
 * Send OTP email via Zoho ZeptoMail API.
 * This is the ONLY file that calls ZeptoMail — nothing else does.
 *
 * If ZEPTOMAIL_SEND_TOKEN is not set, falls back to console logging
 * for local development.
 */
async function sendOtpEmail(email, otp, purpose = 'signup') {
  const subject =
    purpose === 'signup'
      ? 'VaaniTutor — Verify Your Email'
      : 'VaaniTutor — Password Reset Code';

  const htmlBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #0D9488; margin-bottom: 8px;">VaaniTutor</h2>
      <p style="color: #475569; font-size: 15px;">
        ${purpose === 'signup' ? 'Welcome! Use this code to verify your email:' : 'Use this code to reset your password:'}
      </p>
      <div style="background: #F0FDFA; border: 2px solid #0D9488; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #0F766E;">${otp}</span>
      </div>
      <p style="color: #94A3B8; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  // ─── Local dev fallback: log to console if ZeptoMail is not configured ───
  if (!config.ZEPTOMAIL_SEND_TOKEN) {
    console.log('────────────────────────────────────────');
    console.log(`📧 OTP EMAIL (dev mode — ZeptoMail not configured)`);
    console.log(`   To: ${email}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   OTP: ${otp}`);
    console.log('────────────────────────────────────────');
    return { success: true, dev: true };
  }

  // ─── Production: send via ZeptoMail API ───
  try {
    const response = await axios.post(
      'https://api.zeptomail.in/v1.1/email',
      {
        from: {
          address: config.ZEPTOMAIL_FROM_EMAIL,
          name: config.ZEPTOMAIL_FROM_NAME,
        },
        to: [{ email_address: { address: email } }],
        subject,
        htmlbody: htmlBody,
      },
      {
        headers: {
          Authorization: `Zoho-encrtoken ${config.ZEPTOMAIL_SEND_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return { success: true, messageId: response.data?.data?.[0]?.message_id };
  } catch (err) {
    console.error('❌ ZeptoMail send failed:', err.response?.data || err.message);
    // Don't throw — the caller should still store the OTP.
    // The user just won't receive the email; they can resend.
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
