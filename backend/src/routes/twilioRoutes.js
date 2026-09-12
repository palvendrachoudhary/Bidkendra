const express = require('express');
const router = express.Router();
const twilioController = require('../controllers/twilioController');

// POST /api/twilio/call (and /api/voice/call)
router.post('/call', twilioController.initiateVoiceCall);

// GET /api/twilio/status
router.get('/status', twilioController.getTwilioStatus);

module.exports = router;
