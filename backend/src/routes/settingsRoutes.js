const express = require('express');
const { getSettings, updateSettings, testApiKey } = require('../controllers/settingsController');
const router = express.Router();

router.get('/', getSettings);
router.post('/', updateSettings);
router.post('/test-key', testApiKey);

module.exports = router;

