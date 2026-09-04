const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT verification middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches { userId, email } to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No valid Bearer token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid.',
    });
  }
}

/**
 * Internal service key verification.
 * Used for server-node → server-ai calls via X-Internal-Key header.
 */
function authenticateInternal(req, res, next) {
  const key = req.headers['x-internal-key'];

  if (!key || key !== config.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or missing internal service key',
    });
  }

  next();
}

module.exports = { authenticate, authenticateInternal };
