const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sessionService = require('../services/sessionService');

/**
 * GET /api/practice/session/:languageCode
 * Single entry point to resume or initialize today's 3-activity session.
 * Spec Section 6.9a & 6.9b.
 */
router.get('/:languageCode', authenticate, async (req, res) => {
  try {
    const { languageCode } = req.params;
    const sessionData = await sessionService.getOrCreateDailySession(req.user.userId, languageCode);
    res.json({
      success: true,
      data: sessionData,
    });
  } catch (err) {
    if (err.status === 402) {
      return res.status(402).json({
        success: false,
        error: err.message,
        code: 'PAYMENT_REQUIRED',
      });
    }
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to fetch practice session',
    });
  }
});

/**
 * POST /api/practice/session/:languageCode/speak-turn
 * Record a conversational Speak turn, persist PracticeSession, and advance if turns complete.
 */
router.post('/:languageCode/speak-turn', authenticate, async (req, res) => {
  try {
    const { languageCode } = req.params;
    const result = await sessionService.recordSpeakTurn(req.user.userId, languageCode, req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to record Speak turn',
    });
  }
});

/**
 * POST /api/practice/session/:languageCode/game
 * Record word-order Game completion and advance to Quiz.
 */
router.post('/:languageCode/game', authenticate, async (req, res) => {
  try {
    const { languageCode } = req.params;
    const result = await sessionService.recordGameResult(req.user.userId, languageCode, req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to record Game result',
    });
  }
});

/**
 * POST /api/practice/session/:languageCode/quiz
 * Record Quiz completion, mark DailySession completed, update streak, and unlock next day.
 */
router.post('/:languageCode/quiz', authenticate, async (req, res) => {
  try {
    const { languageCode } = req.params;
    const result = await sessionService.recordQuizResult(req.user.userId, languageCode, req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to record Quiz result',
    });
  }
});

module.exports = router;
