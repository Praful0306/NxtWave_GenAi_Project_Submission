const dotenv = require('dotenv');
const path = require('path');

// Load .env from server-node root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  // ─── MongoDB ───
  MONGODB_URI: process.env.MONGODB_URI || '',

  // ─── JWT ───
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-DO-NOT-USE-IN-PROD',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

  // ─── Internal service key ───
  INTERNAL_SERVICE_KEY: process.env.INTERNAL_SERVICE_KEY || 'dev-internal-key',

  // ─── URLs ───
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // ─── ZeptoMail ───
  ZEPTOMAIL_SEND_TOKEN: process.env.ZEPTOMAIL_SEND_TOKEN || '',
  ZEPTOMAIL_FROM_EMAIL: process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@vaanitutor.com',
  ZEPTOMAIL_FROM_NAME: process.env.ZEPTOMAIL_FROM_NAME || 'VaaniTutor',

  // ─── Google OAuth (end-user sign-in) ───
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  GOOGLE_OAUTH_CALLBACK_URL: process.env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',

  // ─── Zoho OAuth (end-user sign-in — NOT Catalyst service credential) ───
  ZOHO_OAUTH_CLIENT_ID: process.env.ZOHO_OAUTH_CLIENT_ID || '',
  ZOHO_OAUTH_CLIENT_SECRET: process.env.ZOHO_OAUTH_CLIENT_SECRET || '',
  ZOHO_OAUTH_CALLBACK_URL: process.env.ZOHO_OAUTH_CALLBACK_URL || 'http://localhost:5000/api/auth/zoho/callback',

  // ─── Razorpay ───
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // ─── Premium price (server-side only, never from client) ───
  PREMIUM_AMOUNT_PAISE: parseInt(process.env.PREMIUM_AMOUNT_PAISE, 10) || 29900, // ₹299
};

// ─── Validation ───
const requiredInProd = ['JWT_SECRET', 'INTERNAL_SERVICE_KEY'];
if (process.env.NODE_ENV === 'production') {
  for (const key of requiredInProd) {
    if (!config[key] || config[key].startsWith('dev-')) {
      console.error(`FATAL: ${key} must be set properly in production`);
      process.exit(1);
    }
  }
}

module.exports = config;
