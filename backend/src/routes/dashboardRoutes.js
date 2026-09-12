const express = require('express');
const { getStats, getRecentActivity, getComplianceDistribution, getRiskOverview } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);
router.get('/compliance-distribution', getComplianceDistribution);
router.get('/risk-overview', getRiskOverview);

module.exports = router;
