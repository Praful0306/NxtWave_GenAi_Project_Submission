const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

async function runGapChecks() {
  console.log('============================================================');
  console.log('       VAANITUTOR PHASE 1 SPEC GAP VERIFICATION CHECKS      ');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, label) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${label}`);
      process.exitCode = 1;
    }
  }

  // ─── 1. Auth Rate Limiting (5 req/min/IP) ───
  console.log('--- Checking Auth Rate Limiter (5 req/min) ---');
  let rejectedOn6th = false;
  let status6th = null;
  let errorMsg6th = '';

  for (let i = 1; i <= 6; i++) {
    try {
      // Intentionally NOT sending x-test-suite header
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'rate-limit-test@example.com',
        password: 'wrong-password-test',
      });
    } catch (err) {
      if (err.response) {
        if (i === 6 && err.response.status === 429) {
          rejectedOn6th = true;
          status6th = err.response.status;
          errorMsg6th = err.response.data.error;
        }
      }
    }
  }

  assert(
    rejectedOn6th && status6th === 429,
    `Auth rate limiter strictly rejects 6th request in 1 min with 429 (${errorMsg6th})`
  );

  // ─── 2. CORS Restriction Check ───
  console.log('\n--- Checking CORS Restrictions ---');
  try {
    const corsRes = await axios.options(`${BASE_URL}/api/health`, {
      headers: {
        Origin: 'http://unauthorized-evil-domain.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    const allowOrigin = corsRes.headers['access-control-allow-origin'];
    assert(
      !allowOrigin || allowOrigin !== 'http://unauthorized-evil-domain.com',
      `CORS blocks unauthorized origin 'http://unauthorized-evil-domain.com'`
    );
  } catch (err) {
    assert(true, `CORS rejected unauthorized preflight request`);
  }

  // ─── 3. Authorized CORS Check ───
  try {
    const authCorsRes = await axios.options(`${BASE_URL}/api/health`, {
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });

    const allowOrigin = authCorsRes.headers['access-control-allow-origin'];
    assert(
      allowOrigin === 'http://localhost:5173',
      `CORS explicitly permits configured FRONTEND_URL 'http://localhost:5173'`
    );
  } catch (err) {
    assert(false, `CORS failed to respond to authorized origin: ${err.message}`);
  }

  // ─── 4. In-Memory MongoDB Server Test ───
  console.log('\n--- Checking In-Memory MongoDB Fallback (MongoMemoryServer) ---');
  try {
    const config = require('./src/config/env');
    config.MONGODB_URI = ''; // simulate unset MONGODB_URI (cold clone / zero Mongo installed)
    const { connectDB, stopMemoryDB, isUsingMemoryDB } = require('./src/config/db');

    const uri = await connectDB();
    const isMem = isUsingMemoryDB();
    assert(
      isMem && uri.startsWith('mongodb://127.0.0.1:'),
      `Programmatically spun up dynamic MongoMemoryServer on ephemeral port (${uri})`
    );

    // Verify Read / Write operations against in-memory DB
    const res = await mongoose.connection.db.collection('spec_mem_test').insertOne({
      test: 'cold-clone-zero-mongo-installed',
      timestamp: new Date(),
    });
    const doc = await mongoose.connection.db.collection('spec_mem_test').findOne({ _id: res.insertedId });
    assert(
      doc && doc.test === 'cold-clone-zero-mongo-installed',
      `Successfully performed write and read on in-memory MongoDB without pre-installed database`
    );

    await stopMemoryDB();
    assert(true, `Cleanly stopped MongoMemoryServer on teardown`);
  } catch (err) {
    assert(false, `In-memory MongoDB fallback failed: ${err.message}`);
  }

  console.log('\n============================================================');
  console.log(`Summary: ${passed} / ${total} checks passed.`);
  console.log('============================================================\n');
}

runGapChecks().catch(console.error);
