const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// GET /api/alerts/timeline - Fetch alert history (supports ?vendor_name=...&limit=...)
router.get('/timeline', alertController.getAlertTimeline);

// POST /api/alerts/curing - Trigger active bid curing notification & log timeline
router.post('/curing', alertController.triggerCuringAlert);

// POST /api/alerts/timeline - Record manual alert event
router.post('/timeline', alertController.recordTimelineAlert);

module.exports = router;
