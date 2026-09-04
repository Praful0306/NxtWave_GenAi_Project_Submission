const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const UserLanguage = require('../models/UserLanguage');
const Roadmap = require('../models/Roadmap');

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
 * GET /api/languages
 * List all active language enrollments for user with current roadmap summaries.
 * Feeds Dashboard multi-language cards.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userLangs = await UserLanguage.find({
      userId: req.user.userId,
      status: { $ne: 'archived' },
    }).sort({ updatedAt: -1 });

    const languagesWithProgress = await Promise.all(
      userLangs.map(async (ul) => {
        const roadmap = await Roadmap.findOne({
          userId: req.user.userId,
          languageCode: ul.languageCode,
        });

        let completedDays = 0;
        let totalDays = ul.goalDurationDays || 30;
        let currentDayNumber = 1;

        if (roadmap && roadmap.weeks) {
          roadmap.weeks.forEach((w) => {
            w.days.forEach((d) => {
              if (d.completedAt) completedDays++;
            });
          });
          currentDayNumber = Math.min(completedDays + 1, totalDays);
        }

        return {
          ...ul.toObject(),
          completedDays,
          totalDays,
          currentDayNumber,
          hasRoadmap: !!roadmap,
        };
      })
    );

    res.json(languagesWithProgress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/languages/:languageCode/status
 * Archive or activate language enrollment.
 */
router.patch(
  '/:languageCode/status',
  authenticate,
  [body('status').isIn(['active', 'archived'])],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const userLang = await UserLanguage.findOneAndUpdate(
        { userId: req.user.userId, languageCode: req.params.languageCode },
        { status: req.body.status },
        { new: true }
      );

      if (!userLang) {
        return res.status(404).json({ error: 'Language enrollment not found' });
      }

      res.json(userLang);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
