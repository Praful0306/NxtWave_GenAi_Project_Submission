const axios = require('axios');
const config = require('../config/env');

const aiClient = axios.create({
  baseURL: config.AI_SERVICE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': config.INTERNAL_SERVICE_KEY,
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A sleeping host answers the first request with a gateway error or a hang
 * rather than running the app, so one failure says nothing about whether the
 * service works. Retry through the wake-up window before giving up.
 */
function isColdStart(err) {
  const status = err.response?.status;
  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    err.code === 'ECONNABORTED' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT'
  );
}

async function postWithWakeRetry(path, body, { attempts = 3, backoffMs = 4000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await aiClient.post(path, body);
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !isColdStart(err)) throw err;
      console.warn(
        `[WARN] AI service unreachable (${err.response?.status || err.code}) — ` +
          `attempt ${attempt}/${attempts}, retrying in ${backoffMs}ms`
      );
      await sleep(backoffMs);
    }
  }
  throw lastErr;
}

/**
 * Call server-ai to generate a structured roadmap with daily quizzes.
 * Spec Section 6.5 & 8.2.
 */
async function generateRoadmapFromAI(languageCode, level, totalDays) {
  try {
    const response = await postWithWakeRetry('/internal/generate-roadmap', {
      languageCode,
      level,
      totalDays,
    });
    return response.data;
  } catch (err) {
    console.error('[ERROR] aiServiceClient.generateRoadmapFromAI failed:', err.message);
    throw new Error(`AI service roadmap generation failed: ${err.message}`);
  }
}

module.exports = {
  generateRoadmapFromAI,
};
