const axios = require('axios');
const config = require('../config/env');

const aiClient = axios.create({
  baseURL: config.AI_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': config.INTERNAL_SERVICE_KEY,
  },
});

/**
 * Call server-ai to generate a structured roadmap with daily quizzes.
 * Spec Section 6.5 & 8.2.
 */
async function generateRoadmapFromAI(languageCode, level, totalDays) {
  try {
    const response = await aiClient.post('/internal/generate-roadmap', {
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
