const express = require('express');
const { getTenders, getTender, createTender, updateTender, getTenderSubmissions } = require('../controllers/tenderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getTenders)
  .post(protect, authorize('ADMIN', 'OFFICER'), createTender);

router.route('/:id')
  .get(getTender)
  .put(protect, authorize('ADMIN', 'OFFICER'), updateTender);

router.route('/:id/submissions')
  .get(protect, authorize('ADMIN', 'OFFICER', 'AUDITOR'), getTenderSubmissions);

module.exports = router;
