const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const screeningController = require('../controllers/screeningController');
const auth = require('../middleware/authMiddleware');

// POST /api/screen (protected)
router.post('/screen', auth, uploadMiddleware, screeningController.screenResume);

// POST /api/screen/check-duplicate (protected) — pre-submit dedup check
router.post('/screen/check-duplicate', auth, screeningController.checkDuplicate);

// POST /api/screen/submit (protected)
router.post('/screen/submit', auth, screeningController.submitScreening);

module.exports = router;

