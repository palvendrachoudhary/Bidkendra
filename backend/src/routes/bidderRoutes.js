const express = require('express');
const { getBidders, getBidder, addBidder, triggerVerification } = require('../controllers/bidderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('ADMIN', 'OFFICER', 'AUDITOR'), getBidders)
  .post(authorize('ADMIN', 'OFFICER'), addBidder);

router.route('/:id')
  .get(authorize('ADMIN', 'OFFICER', 'AUDITOR'), getBidder);

router.get('/:id/verify', authorize('ADMIN', 'OFFICER'), triggerVerification);

module.exports = router;
