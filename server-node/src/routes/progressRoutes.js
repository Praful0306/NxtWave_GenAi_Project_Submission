/**
 * VaaniTutor — Progress Routes (server-node).
 * Spec Section 8.1: GET /api/progress/:languageCode
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const statsService = require('../services/statsService');
const adaptiveService = require('../services/adaptiveService');

/**
 * GET /api/progress/:languageCode
 * Retrieve progress statistics, fluency trend, error taxonomy breakdown, and current level.
 */
router.get('/:languageCode', authenticate, async (req, res) => {

  try {
    const { languageCode } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!languageCode) {
      return res.status(400).json({
        success: false,
        error: 'languageCode parameter is required',
      });
    }

    const progressData = await statsService.getProgressData(userId, languageCode);

    if (!progressData) {
      return res.status(404).json({
        success: false,
        error: `Language ${languageCode} not found for this user`,
      });
    }

    // Include read-only adaptive difficulty metrics
    const adaptiveStatus = await adaptiveService.getAdaptiveStatus(userId, languageCode);

    return res.status(200).json({
      success: true,
      data: {
        ...progressData,
        adaptiveStatus,
      },
    });


  } catch (err) {
    console.error('[ProgressRoutes] Error fetching progress:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve progress analytics',
    });
  }
});

module.exports = router;
