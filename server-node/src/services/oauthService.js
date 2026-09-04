const axios = require('axios');
const User = require('../models/User');
const { issueJwt } = require('./authService');
const config = require('../config/env');

// ─── Zoho OAuth endpoints ───
const ZOHO_AUTH_URL = 'https://accounts.zoho.in/oauth/v2/auth';
const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';
const ZOHO_PROFILE_URL = 'https://accounts.zoho.in/oauth/user/info';

// ─── Google OAuth endpoints ───
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Build the Google OAuth consent URL.
 * Redirects the browser to Google's sign-in page.
 */
function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: config.GOOGLE_OAUTH_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Handle the Google OAuth callback.
 * Exchanges auth code → access token → fetches profile → find-or-create User → issue JWT.
 *
 * Google has already verified this email, so emailVerified = true immediately (Section 4).
 */
async function handleGoogleCallback(code) {
  // ─── Exchange code for tokens ───
  const tokenRes = await axios.post(GOOGLE_TOKEN_URL, {
    code,
    client_id: config.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: config.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: config.GOOGLE_OAUTH_CALLBACK_URL,
    grant_type: 'authorization_code',
  });

  const { access_token } = tokenRes.data;

  // ─── Fetch profile ───
  const profileRes = await axios.get(GOOGLE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const { id: googleId, email, name } = profileRes.data;

  if (!email) {
    const error = new Error('Could not retrieve email from Google');
    error.statusCode = 400;
    throw error;
  }

  // ─── Find or create user ───
  let user = await User.findOne({ email });

  if (user) {
    // Existing user — update googleId if not set, update lastLogin
    if (!user.googleId) {
      user.googleId = googleId;
    }
    user.lastLogin = new Date();
    user.emailVerified = true; // Google verified this email
    await user.save();
  } else {
    // New user — create with Google auth
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      authProvider: 'google',
      googleId,
      emailVerified: true, // Provider already verified (Section 4)
      passwordHash: null,  // OAuth accounts have no password
    });
  }

  // ─── Issue JWT ───
  const token = issueJwt(user._id, user.email);

  return { token, user: user.toSafeJSON() };
}

/**
 * Build the Zoho OAuth consent URL.
 * Section 6.11 — this is END-USER sign-in, NOT the Catalyst service credential (Section 6.4a).
 */
function getZohoAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.ZOHO_OAUTH_CLIENT_ID,
    redirect_uri: config.ZOHO_OAUTH_CALLBACK_URL,
    response_type: 'code',
    scope: 'AaaServer.profile.READ',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Handle the Zoho OAuth callback.
 * Same flow as Google: code → token → profile → find-or-create → JWT.
 *
 * NOT to be confused with Section 6.4a (Catalyst service credential).
 */
async function handleZohoCallback(code) {
  // ─── Exchange code for tokens ───
  const tokenRes = await axios.post(ZOHO_TOKEN_URL, null, {
    params: {
      code,
      client_id: config.ZOHO_OAUTH_CLIENT_ID,
      client_secret: config.ZOHO_OAUTH_CLIENT_SECRET,
      redirect_uri: config.ZOHO_OAUTH_CALLBACK_URL,
      grant_type: 'authorization_code',
    },
  });

  const { access_token } = tokenRes.data;

  // ─── Fetch profile ───
  const profileRes = await axios.get(ZOHO_PROFILE_URL, {
    headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
  });

  const { ZUID: zohoId, Email: email, Display_Name: name } = profileRes.data;

  if (!email) {
    const error = new Error('Could not retrieve email from Zoho');
    error.statusCode = 400;
    throw error;
  }

  // ─── Find or create user ───
  let user = await User.findOne({ email });

  if (user) {
    if (!user.zohoId) {
      user.zohoId = zohoId;
    }
    user.lastLogin = new Date();
    user.emailVerified = true;
    await user.save();
  } else {
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      authProvider: 'zoho',
      zohoId,
      emailVerified: true, // Zoho verified this email (Section 4)
      passwordHash: null,
    });
  }

  // ─── Issue JWT ───
  const token = issueJwt(user._id, user.email);

  return { token, user: user.toSafeJSON() };
}

module.exports = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getZohoAuthUrl,
  handleZohoCallback,
};
