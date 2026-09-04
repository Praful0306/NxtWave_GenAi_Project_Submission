const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimit');

// ─── Routes ───
const authRoutes = require('./routes/authRoutes');
const languageRoutes = require('./routes/languageRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');

const app = express();

// ═══════════════════════════════════════════════
// MIDDLEWARE STACK
// ═══════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS — restricted to FRONTEND_URL
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key'],
  })
);

// Request logging
app.use(morgan('dev'));

// Body parsing — with raw body preserved for webhook signature verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      // Store raw body for Razorpay webhook signature verification (Phase 7)
      if (req.originalUrl === '/api/payments/webhook') {
        req.rawBody = buf;
      }
    },
  })
);

// General rate limiter
app.use(generalLimiter);

// ═══════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vaanitutor-server-node',
    timestamp: new Date().toISOString(),
  });
});

const sessionRoutes = require('./routes/sessionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Auth (email+OTP, Google OAuth, Zoho OAuth, profile)
app.use('/api/auth', authRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/practice/session', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/payments', paymentRoutes);


// ═══════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ═══════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ═══════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════

async function start() {
  await connectDB();
  app.listen(config.PORT, () => {
    console.log(`\n[OK] server-node running on port ${config.PORT}`);
    console.log(`     Frontend URL: ${config.FRONTEND_URL}`);
    console.log(`     AI Service:   ${config.AI_SERVICE_URL}\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
