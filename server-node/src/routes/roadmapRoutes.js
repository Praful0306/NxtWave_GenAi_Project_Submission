const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const roadmapService = require('../services/roadmapService');

const router = express.Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

/**
 * POST /api/roadmap/generate
 * Onboarding or adding a new language.
 */
router.post(
  '/generate',
  authenticate,
  [
    body('languageCode').notEmpty().withMessage('languageCode is required'),
    body('level').optional().isIn(['Basic', 'Intermediate', 'Advanced']),
    body('goalDurationDays').optional().isInt({ min: 1, max: 365 }),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const result = await roadmapService.generateRoadmap(req.user.userId, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/roadmap/:languageCode
 * Get active roadmap and current enrollment.
 */
router.get('/:languageCode', authenticate, async (req, res) => {
  try {
    const result = await roadmapService.getRoadmap(req.user.userId, req.params.languageCode);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /api/roadmap/:languageCode/regenerate
 * Regenerate roadmap when user edits level or goal duration.
 * Spec Section 6.8.
 */
router.post(
  '/:languageCode/regenerate',
  authenticate,
  [
    body('newLevel').optional().isIn(['Basic', 'Intermediate', 'Advanced']),
    body('newGoalDurationDays').optional().isInt({ min: 1, max: 365 }),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const result = await roadmapService.regenerateRoadmap(
        req.user.userId,
        req.params.languageCode,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

module.exports = router;
